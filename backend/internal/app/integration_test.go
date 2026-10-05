package app

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"sistema-tkd/backend/internal/store"
)

// Estas pruebas necesitan PostgreSQL: TEST_DATABASE_URL=postgres://... go test ./internal/app
// Reinician los datos demo de la escuela principal, así que deben usar una base desechable.
type apiClient struct {
	t      *testing.T
	router http.Handler
	cookie *http.Cookie
	csrf   string
}

func newIntegrationClient(t *testing.T) (*apiClient, *Server) {
	t.Helper()
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		t.Skip("TEST_DATABASE_URL no está definido")
	}
	ctx := context.Background()
	cfg := store.LoadConfig()
	cfg.DatabaseURL, cfg.DemoMode = url, true
	cfg.MigrationsDir, cfg.SeedFile = "../../migrations", "../../seed/001_demo.sql"
	db, err := store.Open(ctx, cfg)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(db.Close)
	if err = store.Migrate(ctx, db, cfg.MigrationsDir); err != nil {
		t.Fatal(err)
	}
	if err = store.Seed(ctx, db, cfg.SeedFile); err != nil {
		t.Fatal(err)
	}
	if err = store.ResetDemo(ctx, db, cfg.SeedFile, "00000000-0000-0000-0000-000000000001"); err != nil {
		t.Fatal(err)
	}
	srv := NewServer(db, cfg)
	c := &apiClient{t: t, router: srv.Router(t.TempDir())}
	rec := c.do("POST", "/api/auth/login", `{"email":"maestra@sistematkd.local","password":"SistemaTKD2026!"}`)
	if rec.Code != 200 {
		t.Fatalf("login: %d %s", rec.Code, rec.Body)
	}
	var body struct {
		CSRF string `json:"csrfToken"`
	}
	_ = json.Unmarshal(rec.Body.Bytes(), &body)
	c.csrf = body.CSRF
	c.cookie = rec.Result().Cookies()[0]
	return c, srv
}

func (c *apiClient) do(method, path, body string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, path, bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	if c.cookie != nil {
		req.AddCookie(c.cookie)
		req.Header.Set("X-CSRF-Token", c.csrf)
	}
	rec := httptest.NewRecorder()
	c.router.ServeHTTP(rec, req)
	return rec
}

func (c *apiClient) expect(status int, method, path, body string) *httptest.ResponseRecorder {
	c.t.Helper()
	rec := c.do(method, path, body)
	if rec.Code != status {
		c.t.Fatalf("%s %s: esperaba %d y devolvió %d: %s", method, path, status, rec.Code, rec.Body)
	}
	return rec
}

func TestPaymentWithoutMethodAndOverpayment(t *testing.T) {
	c, _ := newIntegrationClient(t)
	const charge = "50000000-0000-0000-0000-000000000001" // total 850, recibido 500
	c.expect(201, "POST", "/api/payments", `{"chargeId":"`+charge+`","amount":"100","date":"2026-10-03","method":"","observation":""}`)
	c.expect(400, "POST", "/api/payments", `{"chargeId":"`+charge+`","amount":"9999","date":"2026-10-03","method":"Efectivo"}`)
	c.expect(400, "POST", "/api/payments", `{"chargeId":"`+charge+`","amount":"10","date":"2026-10-03","method":"Cripto"}`)
}

func TestOrderCodesDoNotCollideWithSeed(t *testing.T) {
	c, _ := newIntegrationClient(t)
	order := `{"studentId":"20000000-0000-0000-0000-000000000001","dueDate":"2026-10-20","items":[{"name":"Guantes","size":"M","price":"300","quantity":1}]}`
	first := c.expect(201, "POST", "/api/orders", order)
	second := c.expect(201, "POST", "/api/orders", order)
	if !strings.Contains(first.Body.String(), "P-106") || !strings.Contains(second.Body.String(), "P-107") {
		t.Fatalf("códigos inesperados: %s %s", first.Body, second.Body)
	}
}

func TestCancelledSessionRejectsAttendanceAndInvitations(t *testing.T) {
	c, srv := newIntegrationClient(t)
	ctx := context.Background()
	var session string
	var version int
	if err := srv.DB.QueryRow(ctx, `SELECT id::text,version FROM class_sessions WHERE school_id='00000000-0000-0000-0000-000000000001' AND status='scheduled' LIMIT 1`).Scan(&session, &version); err != nil {
		t.Fatal(err)
	}
	var student string
	var participantVersion int
	if err := srv.DB.QueryRow(ctx, `SELECT student_id::text,version FROM session_participants WHERE session_id=$1 LIMIT 1`, session).Scan(&student, &participantVersion); err != nil {
		t.Fatal(err)
	}
	c.expect(204, "PUT", "/api/sessions/"+session+"/status", `{"status":"Cancelada","version":`+itoa(version)+`}`)
	c.expect(409, "PUT", "/api/sessions/"+session+"/attendance/"+student, `{"status":"Presente","observation":"","version":`+itoa(participantVersion)+`}`)
	c.expect(409, "POST", "/api/sessions/"+session+"/participants", `{"studentId":"20000000-0000-0000-0000-000000000006"}`)
}

func TestNoteRejectsSessionFromAnotherSchool(t *testing.T) {
	c, srv := newIntegrationClient(t)
	ctx := context.Background()
	var foreign string
	err := srv.DB.QueryRow(ctx, `WITH g AS (INSERT INTO class_groups(school_id,name,days,start_time,end_time) VALUES('00000000-0000-0000-0000-000000000002','Ajeno',ARRAY['Lunes'],'10:00','11:00') ON CONFLICT (school_id,name) DO UPDATE SET name=EXCLUDED.name RETURNING id) INSERT INTO class_sessions(school_id,group_id,session_date,start_time,end_time) SELECT '00000000-0000-0000-0000-000000000002',g.id,'2026-10-04','10:00','11:00' FROM g ON CONFLICT (school_id,group_id,session_date) DO UPDATE SET start_time=EXCLUDED.start_time RETURNING id::text`).Scan(&foreign)
	if err != nil {
		t.Fatal(err)
	}
	c.expect(400, "POST", "/api/students/20000000-0000-0000-0000-000000000001/notes", `{"date":"2026-10-03","topic":"Tema","text":"Texto","sessionId":"`+foreign+`"}`)
}

func TestBulkOrderProgressIsAtomicAndKeepsDimensions(t *testing.T) {
	c, srv := newIntegrationClient(t)
	ctx := context.Background()
	const order = "40000000-0000-0000-0000-000000000001" // Dobok recibido 1/1, protector 0/1
	type item struct {
		ID      string `json:"id"`
		Version int    `json:"version"`
	}
	load := func() []item {
		rows, err := srv.DB.Query(ctx, `SELECT id::text,version FROM order_items WHERE order_id=$1 AND NOT cancelled ORDER BY id`, order)
		if err != nil {
			t.Fatal(err)
		}
		defer rows.Close()
		var items []item
		for rows.Next() {
			var it item
			if err = rows.Scan(&it.ID, &it.Version); err != nil {
				t.Fatal(err)
			}
			items = append(items, it)
		}
		return items
	}
	items := load()
	stale := append([]item(nil), items...)
	stale[len(stale)-1].Version += 7
	staleBody, _ := json.Marshal(map[string]any{"mode": "receivePending", "items": stale})
	c.expect(409, "POST", "/api/orders/"+order+"/progress", string(staleBody))
	var received int
	_ = srv.DB.QueryRow(ctx, `SELECT sum(received_quantity) FROM order_items WHERE order_id=$1`, order).Scan(&received)
	if received != 1 {
		t.Fatalf("una versión obsoleta modificó el pedido: recibido=%d", received)
	}
	body, _ := json.Marshal(map[string]any{"mode": "receivePending", "items": items})
	c.expect(204, "POST", "/api/orders/"+order+"/progress", string(body))
	var delivered int
	_ = srv.DB.QueryRow(ctx, `SELECT sum(received_quantity),sum(delivered_quantity) FROM order_items WHERE order_id=$1`, order).Scan(&received, &delivered)
	if received != 2 || delivered != 0 {
		t.Fatalf("recibir pendientes cambió entregas: recibido=%d entregado=%d", received, delivered)
	}
}

func TestResetDemoSucceeds(t *testing.T) {
	c, _ := newIntegrationClient(t)
	c.expect(204, "POST", "/api/demo/reset", `{"confirm":"RESTABLECER"}`)
}

func itoa(n int) string { b, _ := json.Marshal(n); return string(b) }
