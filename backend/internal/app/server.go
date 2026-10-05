package app

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
	"sistema-tkd/backend/internal/pagos"
	"sistema-tkd/backend/internal/store"
)

const cookieName = "tkd_session"

type Server struct {
	DB     *pgxpool.Pool
	Config store.Config
}

func NewServer(db *pgxpool.Pool, cfg store.Config) *Server { return &Server{DB: db, Config: cfg} }
func randomToken() string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	return base64.RawURLEncoding.EncodeToString(b)
}

func (s *Server) Router(frontend string) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery(), secureHeaders())
	r.POST("/api/auth/login", s.login)
	r.GET("/api/auth/me", s.auth(), s.me)
	r.POST("/api/auth/logout", s.auth(), s.csrf(), s.logout)
	a := r.Group("/api", s.auth(), s.csrf())
	a.GET("/bootstrap", s.bootstrap)
	a.POST("/demo/reset", s.resetDemo)
	a.POST("/students", s.createStudent)
	a.PUT("/students/:id", s.updateStudent)
	a.POST("/students/:id/status", s.studentStatus)
	a.POST("/students/:id/notes", s.createNote)
	a.PUT("/notes/:id", s.updateNote)
	a.DELETE("/notes/:id", s.deleteNote)
	a.POST("/groups", s.createGroup)
	a.PUT("/groups/:id", s.updateGroup)
	a.POST("/groups/:id/assignments", s.assignStudent)
	a.POST("/sessions", s.createSession)
	a.POST("/sessions/:id/participants", s.inviteParticipant)
	a.PUT("/sessions/:id/attendance/:student", s.attendance)
	a.PUT("/sessions/:id/status", s.sessionStatus)
	a.POST("/payments", s.createPayment)
	a.PUT("/payments/:id", s.correctPayment)
	a.POST("/payments/:id/void", s.voidPayment)
	a.POST("/discounts", s.createDiscount)
	a.POST("/orders", s.createOrder)
	a.POST("/orders/:id/progress", s.updateOrderProgressBulk)
	a.PUT("/order-items/:id", s.updateOrderItem)
	r.StaticFile("/", filepath.Join(frontend, "index.html"))
	r.Static("/assets", filepath.Join(frontend, "assets"))
	r.Static("/fonts", filepath.Join(frontend, "fonts"))
	r.StaticFile("/favicon.svg", filepath.Join(frontend, "favicon.svg"))
	r.NoRoute(func(c *gin.Context) {
		if strings.HasPrefix(c.Request.URL.Path, "/api/") {
			c.JSON(404, gin.H{"error": "Ruta no encontrada"})
			return
		}
		// Un archivo estático inexistente no debe responder 200 con el HTML de la aplicación.
		if filepath.Ext(c.Request.URL.Path) != "" {
			c.Status(404)
			return
		}
		c.File(filepath.Join(frontend, "index.html"))
	})
	return r
}

func secureHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("Referrer-Policy", "same-origin")
		c.Next()
	}
}
func (s *Server) setCookie(c *gin.Context, value string, maxAge int) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(cookieName, value, maxAge, "/", "", s.Config.SecureCookies, true)
}
func (s *Server) auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		raw, e := c.Cookie(cookieName)
		if e != nil {
			c.AbortWithStatusJSON(401, gin.H{"error": "Inicia sesión"})
			return
		}
		var uid, sid, csrf string
		e = s.DB.QueryRow(c, `SELECT u.id::text,u.school_id::text,a.csrf_token FROM auth_sessions a JOIN users u ON u.id=a.user_id WHERE a.token_hash=$1 AND a.expires_at>now()`, store.HashToken(raw)).Scan(&uid, &sid, &csrf)
		if e != nil {
			c.AbortWithStatusJSON(401, gin.H{"error": "Sesión inválida"})
			return
		}
		c.Set("user", uid)
		c.Set("school", sid)
		c.Set("csrf", csrf)
		c.Next()
	}
}
func (s *Server) csrf() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == http.MethodGet || c.Request.Method == http.MethodHead {
			c.Next()
			return
		}
		if c.GetHeader("X-CSRF-Token") != c.GetString("csrf") {
			c.AbortWithStatusJSON(403, gin.H{"error": "Token CSRF inválido"})
			return
		}
		c.Next()
	}
}

func (s *Server) login(c *gin.Context) {
	var in struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if c.ShouldBindJSON(&in) != nil {
		c.JSON(400, gin.H{"error": "Datos inválidos"})
		return
	}
	var uid, hash string
	if s.DB.QueryRow(c, `SELECT id::text,password_hash FROM users WHERE lower(email)=lower($1)`, strings.TrimSpace(in.Email)).Scan(&uid, &hash) != nil || bcrypt.CompareHashAndPassword([]byte(hash), []byte(in.Password)) != nil {
		c.JSON(401, gin.H{"error": "Correo o contraseña incorrectos"})
		return
	}
	raw, csrf := randomToken(), randomToken()
	_, e := s.DB.Exec(c, `INSERT INTO auth_sessions(token_hash,user_id,csrf_token,expires_at) VALUES($1,$2,$3,now()+interval '12 hours')`, store.HashToken(raw), uid, csrf)
	if e != nil {
		c.JSON(500, gin.H{"error": "No fue posible iniciar sesión"})
		return
	}
	s.setCookie(c, raw, 43200)
	c.JSON(200, gin.H{"csrfToken": csrf})
}
func (s *Server) me(c *gin.Context) {
	c.JSON(200, gin.H{"authenticated": true, "csrfToken": c.GetString("csrf")})
}
func (s *Server) logout(c *gin.Context) {
	raw, _ := c.Cookie(cookieName)
	_, _ = s.DB.Exec(c, `DELETE FROM auth_sessions WHERE token_hash=$1`, store.HashToken(raw))
	s.setCookie(c, "", -1)
	c.Status(204)
}

func (s *Server) resetDemo(c *gin.Context) {
	if !s.Config.DemoMode {
		c.JSON(404, gin.H{"error": "El restablecimiento no está disponible"})
		return
	}
	var in struct {
		Confirm string `json:"confirm"`
	}
	if c.ShouldBindJSON(&in) != nil || in.Confirm != "RESTABLECER" {
		c.JSON(400, gin.H{"error": "Escribe RESTABLECER para confirmar"})
		return
	}
	if err := store.ResetDemo(c, s.DB, s.Config.SeedFile, c.GetString("school")); err != nil {
		c.JSON(500, gin.H{"error": "No se pudieron restablecer los datos"})
		return
	}
	s.setCookie(c, "", -1)
	c.Status(204)
}

func (s *Server) GenerateMonthlyCharges(ctx context.Context, today time.Time) error {
	return s.generateMonthlyCharges(ctx, today, "")
}

// generateMonthlyCharges crea las mensualidades faltantes; con studentID sólo las de ese alumno.
func (s *Server) generateMonthlyCharges(ctx context.Context, today time.Time, studentID string) error {
	rows, e := s.DB.Query(ctx, `SELECT s.id,s.school_id,s.billing_day,sc.monthly_fee_cents,ap.active_from,ap.active_to FROM students s JOIN schools sc ON sc.id=s.school_id JOIN student_activity_periods ap ON ap.student_id=s.id WHERE ap.active_from<=$1 AND ($2='' OR s.id::text=$2)`, today, studentID)
	if e != nil {
		return e
	}
	defer rows.Close()
	for rows.Next() {
		var student, school string
		var day int
		var fee int64
		var activeFrom time.Time
		var activeTo *time.Time
		if e = rows.Scan(&student, &school, &day, &fee, &activeFrom, &activeTo); e != nil {
			return e
		}
		for _, due := range pagos.CycleDueDates(activeFrom, activeTo, today, day) {
			period := due.Format("2006-01")
			var kind string
			var value int64
			_ = s.DB.QueryRow(ctx, `SELECT kind,value FROM discounts WHERE school_id=$1 AND student_id=$2 AND active AND (recurring OR period=$3) ORDER BY recurring DESC LIMIT 1`, school, student, period).Scan(&kind, &value)
			discount := pagos.DiscountCents(fee, kind, value)
			_, e = s.DB.Exec(ctx, `INSERT INTO charges(school_id,student_id,kind,period,description,original_cents,discount_cents,total_cents,due_date,idempotency_key) VALUES($1,$2,'monthly',$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING`, school, student, period, "Mensualidad "+period, fee, discount, fee-discount, due, "monthly:"+student+":"+period)
			if e != nil {
				return e
			}
		}
	}
	return rows.Err()
}

var errConflict = errors.New("conflicto de versión")
