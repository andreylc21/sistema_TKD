package app

import (
	"context"
	"strings"
	"unicode/utf8"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"sistema-tkd/backend/internal/pagos"
)

func (s *Server) updateSchool(c *gin.Context) {
	var in struct {
		Name    string `json:"name"`
		Owner   string `json:"owner"`
		Fee     string `json:"fee"`
		ExamFee string `json:"examFee"`
	}
	name, owner := "", ""
	if c.ShouldBindJSON(&in) == nil {
		name, owner = strings.TrimSpace(in.Name), strings.TrimSpace(in.Owner)
	}
	fee, fe := pagos.ParseMoney(in.Fee)
	examFee, xe := int64(-1), error(nil)
	if strings.TrimSpace(in.ExamFee) != "" {
		examFee, xe = pagos.ParseMoney(in.ExamFee)
	}
	if xe != nil || name == "" || utf8.RuneCountInString(name) > 80 || owner == "" || utf8.RuneCountInString(owner) > 80 || fe != nil {
		fail(c, 400, "Revisa el nombre, la propietaria y la mensualidad")
		return
	}
	tx, e := s.DB.Begin(c)
	if e != nil {
		fail(c, 500, "No se pudieron guardar los datos")
		return
	}
	defer tx.Rollback(c)
	if _, e = tx.Exec(c, `UPDATE schools SET name=$1,monthly_fee_cents=$2,exam_fee_cents=CASE WHEN $4::bigint>=0 THEN $4 ELSE exam_fee_cents END WHERE id=$3`, name, fee, c.GetString("school"), examFee); e == nil {
		_, e = tx.Exec(c, `UPDATE users SET owner_name=$1 WHERE id=$2 AND school_id=$3`, owner, c.GetString("user"), c.GetString("school"))
	}
	if e != nil || tx.Commit(c) != nil {
		fail(c, 500, "No se pudieron guardar los datos")
		return
	}
	c.Status(204)
}

type gradeRow struct {
	ID    string
	Track string
	Level int
}

// gradeRows devuelve los grados de la escuela en su orden actual.
func gradeRows(ctx context.Context, tx pgx.Tx, school string) ([]gradeRow, error) {
	rows, err := tx.Query(ctx, `SELECT id::text,track,level FROM grades WHERE school_id=$1 ORDER BY sort_order,name FOR UPDATE`, school)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []gradeRow
	for rows.Next() {
		var g gradeRow
		if err = rows.Scan(&g.ID, &g.Track, &g.Level); err != nil {
			return nil, err
		}
		out = append(out, g)
	}
	return out, rows.Err()
}

// resequence guarda el orden indicado y renumera el nivel de las cintas de color por posición.
// Poom y Dan conservan su nivel: de él depende el siguiente grado al aprobar.
func resequence(ctx context.Context, tx pgx.Tx, ids []gradeRow) error {
	color := 0
	for i, g := range ids {
		level := g.Level
		if g.Track == "color" {
			color++
			level = color
		}
		if _, err := tx.Exec(ctx, `UPDATE grades SET sort_order=$1,level=$2 WHERE id=$3`, i+1, level, g.ID); err != nil {
			return err
		}
	}
	return nil
}

func isDuplicate(err error) bool {
	pg, ok := err.(*pgconn.PgError)
	return ok && pg.Code == "23505"
}

func (s *Server) createGrade(c *gin.Context) {
	var in struct {
		Name    string `json:"name"`
		Track   string `json:"track"`
		AfterID string `json:"afterId"`
	}
	if c.ShouldBindJSON(&in) != nil {
		fail(c, 400, "Revisa los datos del grado")
		return
	}
	name := strings.TrimSpace(in.Name)
	if name == "" || utf8.RuneCountInString(name) > 40 || (in.Track != "color" && in.Track != "poom" && in.Track != "dan") {
		fail(c, 400, "Escribe el nombre del grado y elige su tipo")
		return
	}
	school := c.GetString("school")
	tx, e := s.DB.Begin(c)
	if e != nil {
		fail(c, 500, "No se pudo guardar el grado")
		return
	}
	defer tx.Rollback(c)
	list, e := gradeRows(c, tx, school)
	if e != nil {
		fail(c, 500, "No se pudo guardar el grado")
		return
	}
	// Posición: después del grado indicado, o al final de su tipo.
	at, level := len(list), 1
	for i, g := range list {
		if g.Track == in.Track {
			at = i + 1
			if g.Level >= level {
				level = g.Level + 1
			}
		}
		if in.AfterID != "" && g.ID == in.AfterID && g.Track == in.Track && in.Track == "color" {
			at = i + 1
			break
		}
	}
	var id string
	if e = tx.QueryRow(c, `INSERT INTO grades(school_id,name,sort_order,track,level) VALUES($1,$2,0,$3,$4) RETURNING id::text`, school, name, in.Track, level).Scan(&id); e != nil {
		if isDuplicate(e) {
			fail(c, 409, "Ya existe un grado con ese nombre")
			return
		}
		fail(c, 500, "No se pudo guardar el grado")
		return
	}
	list = append(list[:at], append([]gradeRow{{ID: id, Track: in.Track, Level: level}}, list[at:]...)...)
	if e = resequence(c, tx, list); e != nil || tx.Commit(c) != nil {
		fail(c, 500, "No se pudo guardar el grado")
		return
	}
	c.JSON(201, gin.H{"id": id})
}

func (s *Server) renameGrade(c *gin.Context) {
	var in struct {
		Name string `json:"name"`
	}
	name := ""
	if c.ShouldBindJSON(&in) == nil {
		name = strings.TrimSpace(in.Name)
	}
	if name == "" || utf8.RuneCountInString(name) > 40 {
		fail(c, 400, "Escribe el nombre del grado (hasta 40 caracteres)")
		return
	}
	tag, e := s.DB.Exec(c, `UPDATE grades SET name=$1 WHERE id=$2 AND school_id=$3`, name, c.Param("id"), c.GetString("school"))
	if e != nil {
		if isDuplicate(e) {
			fail(c, 409, "Ya existe un grado con ese nombre")
			return
		}
		fail(c, 500, "No se pudo renombrar el grado")
		return
	}
	if tag.RowsAffected() == 0 {
		fail(c, 404, "Grado no encontrado")
		return
	}
	c.Status(204)
}

// moveGrade sube o baja una cinta de color un lugar entre las demás de color.
func (s *Server) moveGrade(c *gin.Context) {
	var in struct {
		Direction string `json:"direction"`
	}
	if c.ShouldBindJSON(&in) != nil || (in.Direction != "up" && in.Direction != "down") {
		fail(c, 400, "Indica si el grado sube o baja")
		return
	}
	tx, e := s.DB.Begin(c)
	if e != nil {
		fail(c, 500, "No se pudo mover el grado")
		return
	}
	defer tx.Rollback(c)
	list, e := gradeRows(c, tx, c.GetString("school"))
	if e != nil {
		fail(c, 500, "No se pudo mover el grado")
		return
	}
	from := -1
	for i, g := range list {
		if g.ID == c.Param("id") {
			from = i
		}
	}
	if from < 0 {
		fail(c, 404, "Grado no encontrado")
		return
	}
	to := from - 1
	if in.Direction == "down" {
		to = from + 1
	}
	if list[from].Track != "color" {
		fail(c, 409, "Solo las cintas de color se pueden reordenar; Poom y Dan siguen su nivel")
		return
	}
	if to < 0 || to >= len(list) || list[to].Track != "color" {
		fail(c, 409, "El grado ya está en ese extremo")
		return
	}
	list[from], list[to] = list[to], list[from]
	if e = resequence(c, tx, list); e != nil || tx.Commit(c) != nil {
		fail(c, 500, "No se pudo mover el grado")
		return
	}
	c.Status(204)
}

// removeGrade borra un grado; si hay alumnos o historial de exámenes con él, pasan al grado
// de reemplazo indicado.
func (s *Server) removeGrade(c *gin.Context) {
	var in struct {
		ReplacementID string `json:"replacementId"`
	}
	_ = c.ShouldBindJSON(&in)
	school := c.GetString("school")
	tx, e := s.DB.Begin(c)
	if e != nil {
		fail(c, 500, "No se pudo borrar el grado")
		return
	}
	defer tx.Rollback(c)
	list, e := gradeRows(c, tx, school)
	if e != nil {
		fail(c, 500, "No se pudo borrar el grado")
		return
	}
	var target *gradeRow
	maxLevel := map[string]int{}
	for i, g := range list {
		if g.ID == c.Param("id") {
			target = &list[i]
		}
		if g.Level > maxLevel[g.Track] {
			maxLevel[g.Track] = g.Level
		}
	}
	if target == nil {
		fail(c, 404, "Grado no encontrado")
		return
	}
	if len(list) < 2 {
		fail(c, 409, "Debe quedar al menos un grado")
		return
	}
	if target.Track != "color" && target.Level != maxLevel[target.Track] {
		fail(c, 409, "Solo se puede borrar el nivel más alto de Poom o Dan, para no dejar huecos en la progresión")
		return
	}
	var students, entries int
	_ = tx.QueryRow(c, `SELECT (SELECT count(*) FROM students WHERE grade_id=$1),(SELECT count(*) FROM exam_entries WHERE grade_from_id=$1 OR grade_to_id=$1)`, target.ID).Scan(&students, &entries)
	if students+entries > 0 {
		valid := false
		for _, g := range list {
			valid = valid || (g.ID == in.ReplacementID && g.ID != target.ID)
		}
		if !valid {
			fail(c, 409, "Elige a qué grado pasan los alumnos de este grado")
			return
		}
		if _, e = tx.Exec(c, `UPDATE students SET grade_id=$1,version=version+1,updated_at=now() WHERE grade_id=$2 AND school_id=$3`, in.ReplacementID, target.ID, school); e == nil {
			_, e = tx.Exec(c, `UPDATE exam_entries SET grade_from_id=CASE WHEN grade_from_id=$2 THEN $1::uuid ELSE grade_from_id END, grade_to_id=CASE WHEN grade_to_id=$2 THEN $1::uuid ELSE grade_to_id END WHERE school_id=$3 AND (grade_from_id=$2 OR grade_to_id=$2)`, in.ReplacementID, target.ID, school)
		}
		if e != nil {
			fail(c, 500, "No se pudo mover a los alumnos")
			return
		}
	}
	if _, e = tx.Exec(c, `DELETE FROM grades WHERE id=$1 AND school_id=$2`, target.ID, school); e != nil {
		fail(c, 500, "No se pudo borrar el grado")
		return
	}
	rest := make([]gradeRow, 0, len(list)-1)
	for _, g := range list {
		if g.ID != target.ID {
			rest = append(rest, g)
		}
	}
	if e = resequence(c, tx, rest); e != nil || tx.Commit(c) != nil {
		fail(c, 500, "No se pudo borrar el grado")
		return
	}
	c.Status(204)
}

type catalogInput struct {
	Name     string   `json:"name"`
	Category string   `json:"category"`
	Sizes    []string `json:"sizes"`
	Price    string   `json:"price"`
}

// parseCatalog valida y normaliza un artículo del catálogo.
func parseCatalog(c *gin.Context) (name, category string, sizes []string, price int64, ok bool) {
	var in catalogInput
	if c.ShouldBindJSON(&in) != nil {
		fail(c, 400, "Revisa los datos del artículo")
		return
	}
	name = strings.TrimSpace(in.Name)
	category = in.Category
	if category == "" {
		category = "Equipo de protección"
	}
	if category != "Uniformes" && category != "Equipo de protección" {
		fail(c, 400, "Elige una categoría válida")
		return
	}
	cents, e := pagos.ParseMoney(in.Price)
	if name == "" || utf8.RuneCountInString(name) > 60 || e != nil || cents < 0 {
		fail(c, 400, "Escribe el nombre y un precio válido")
		return
	}
	seen := map[string]bool{}
	sizes = []string{}
	for _, size := range in.Sizes {
		size = strings.TrimSpace(size)
		if size == "" || utf8.RuneCountInString(size) > 20 || seen[strings.ToLower(size)] {
			continue
		}
		seen[strings.ToLower(size)] = true
		sizes = append(sizes, size)
	}
	return name, category, sizes, cents, true
}

func (s *Server) createCatalogItem(c *gin.Context) {
	name, category, sizes, price, ok := parseCatalog(c)
	if !ok {
		return
	}
	var id string
	e := s.DB.QueryRow(c, `INSERT INTO catalog_items(school_id,name,sizes,price_cents,category) VALUES($1,$2,$3,$4,$5) RETURNING id::text`, c.GetString("school"), name, sizes, price, category).Scan(&id)
	if e != nil {
		if isDuplicate(e) {
			fail(c, 409, "Ya existe un artículo con ese nombre")
			return
		}
		fail(c, 500, "No se pudo guardar el artículo")
		return
	}
	c.JSON(201, gin.H{"id": id})
}

func (s *Server) updateCatalogItem(c *gin.Context) {
	name, category, sizes, price, ok := parseCatalog(c)
	if !ok {
		return
	}
	tag, e := s.DB.Exec(c, `UPDATE catalog_items SET name=$1,sizes=$2,price_cents=$3,category=$6 WHERE id=$4 AND school_id=$5`, name, sizes, price, c.Param("id"), c.GetString("school"), category)
	if e != nil {
		if isDuplicate(e) {
			fail(c, 409, "Ya existe un artículo con ese nombre")
			return
		}
		fail(c, 500, "No se pudo guardar el artículo")
		return
	}
	if tag.RowsAffected() == 0 {
		fail(c, 404, "Artículo no encontrado")
		return
	}
	c.Status(204)
}

func (s *Server) deleteCatalogItem(c *gin.Context) {
	tag, e := s.DB.Exec(c, `DELETE FROM catalog_items WHERE id=$1 AND school_id=$2`, c.Param("id"), c.GetString("school"))
	if e != nil {
		fail(c, 500, "No se pudo borrar el artículo")
		return
	}
	if tag.RowsAffected() == 0 {
		fail(c, 404, "Artículo no encontrado")
		return
	}
	c.Status(204)
}
