package app

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"sistema-tkd/backend/internal/examenes"
	"sistema-tkd/backend/internal/pagos"
	"sistema-tkd/backend/internal/store"
)

type rowQuerier interface {
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
}

// studentProgress agrupa lo necesario para evaluar el avance hacia cinta negra.
type studentProgress struct {
	Eligible bool
	Progress examenes.Progress
}

// loadProgress calcula el avance de los alumnos de la escuela (o de uno solo si studentID no
// está vacío). Sólo son elegibles quienes están en la última cinta de color o ya son cinta negra.
func loadProgress(ctx context.Context, q rowQuerier, school, studentID string, today time.Time) (map[string]studentProgress, error) {
	rows, err := q.Query(ctx, `
SELECT s.id::text, g.track, g.level,
  NOT EXISTS (SELECT 1 FROM grades g2 WHERE g2.school_id=g.school_id AND g2.track='color' AND g2.sort_order>g.sort_order) AS last_color,
  lf.d,
  (SELECT count(*) FROM exam_entries en JOIN exams e ON e.id=en.exam_id
    WHERE en.student_id=s.id AND e.kind='partial' AND en.result='passed' AND en.counts_for_dan
      AND (lf.d IS NULL OR e.exam_date>lf.d))::int,
  date_part('year', age($3::date, s.birth_date))::int
FROM students s
JOIN grades g ON g.id=s.grade_id
LEFT JOIN LATERAL (
  SELECT max(e.exam_date) AS d FROM exam_entries en JOIN exams e ON e.id=en.exam_id
  WHERE en.student_id=s.id AND e.kind='black' AND en.result='passed') lf ON true
WHERE s.school_id=$1 AND ($2='' OR s.id::text=$2)`, school, studentID, today)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[string]studentProgress{}
	for rows.Next() {
		var id, track string
		var level, partials, age int
		var lastColor bool
		var lastFinal *time.Time
		if err = rows.Scan(&id, &track, &level, &lastColor, &lastFinal, &partials, &age); err != nil {
			return nil, err
		}
		eligible := track != "color" || lastColor
		target := 1
		if track != "color" {
			target = level + 1
		}
		var months *int
		if lastFinal != nil {
			m := max(0, int(today.Sub(*lastFinal).Hours()/24/30.4375))
			months = &m
		}
		out[id] = studentProgress{Eligible: eligible, Progress: examenes.Evaluate(target, age, partials, months)}
	}
	return out, rows.Err()
}

func (s *Server) createExam(c *gin.Context) {
	var in struct {
		Kind     string `json:"kind"`
		Name     string `json:"name"`
		Date     string `json:"date"`
		Fee      string `json:"fee"`
		Deadline string `json:"paymentDeadline"`
	}
	if c.ShouldBindJSON(&in) != nil || (in.Kind != "partial" && in.Kind != "black") {
		fail(c, 400, "Indica el tipo, la fecha y el costo del examen")
		return
	}
	date, e := time.Parse("2006-01-02", in.Date)
	fee, fe := pagos.ParseMoney(in.Fee)
	if e != nil || fe != nil || fee < 0 {
		fail(c, 400, "Fecha o costo inválidos")
		return
	}
	// Plazo de pago por defecto: una semana antes del examen.
	deadline := date.AddDate(0, 0, -examenes.DefaultLeadDays(in.Kind))
	if in.Deadline != "" {
		if deadline, e = time.Parse("2006-01-02", in.Deadline); e != nil || deadline.After(date) {
			fail(c, 400, "La fecha límite de pago no puede ser posterior al examen")
			return
		}
	}
	tx, e := s.DB.Begin(c)
	if e != nil {
		fail(c, 500, "No se pudo crear el examen")
		return
	}
	defer tx.Rollback(c)
	key := idem(c)
	if existing, replayed, err := reserveIdempotency(c, tx, c.GetString("school"), key, "createExam"); err != nil {
		fail(c, http.StatusConflict, err.Error())
		return
	} else if replayed {
		c.JSON(http.StatusOK, gin.H{"id": existing, "replayed": true})
		return
	}
	var id string
	e = tx.QueryRow(c, `INSERT INTO exams(school_id,kind,exam_date,fee_cents,payment_deadline,name) VALUES($1,$2,$3,$4,$5,$6) RETURNING id::text`, c.GetString("school"), in.Kind, date, fee, deadline, strings.TrimSpace(in.Name)).Scan(&id)
	if e == nil {
		e = completeIdempotency(c, tx, c.GetString("school"), key, "createExam", id)
	}
	if e != nil {
		fail(c, 400, "No se pudo crear el examen")
		return
	}
	if e = tx.Commit(c); e != nil {
		fail(c, 500, "No se pudo guardar el examen")
		return
	}
	c.JSON(201, gin.H{"id": id})
}

// updateExam reprograma un examen: fecha, costo y fecha límite de pago. Sólo mientras nadie
// tenga resultado; los cobros de los inscritos se ajustan a los nuevos datos.
func (s *Server) updateExam(c *gin.Context) {
	var in struct {
		Kind     string `json:"kind"`
		Name     string `json:"name"`
		Date     string `json:"date"`
		Fee      string `json:"fee"`
		Deadline string `json:"paymentDeadline"`
	}
	if c.ShouldBindJSON(&in) != nil || (in.Kind != "" && in.Kind != "partial" && in.Kind != "black") {
		fail(c, 400, "Indica la fecha, el costo y la fecha límite de pago")
		return
	}
	date, e := time.Parse("2006-01-02", in.Date)
	fee, fe := pagos.ParseMoney(in.Fee)
	deadline, de := time.Parse("2006-01-02", in.Deadline)
	if e != nil || fe != nil || de != nil || fee < 0 {
		fail(c, 400, "Fecha o costo inválidos")
		return
	}
	if deadline.After(date) {
		fail(c, 400, "La fecha límite de pago no puede ser posterior al examen")
		return
	}
	school := c.GetString("school")
	tx, e := s.DB.Begin(c)
	if e != nil {
		fail(c, 500, "No se pudo guardar el examen")
		return
	}
	defer tx.Rollback(c)
	var kind string
	var oldFee int64
	if tx.QueryRow(c, `SELECT kind,fee_cents FROM exams WHERE id=$1 AND school_id=$2 FOR UPDATE`, c.Param("id"), school).Scan(&kind, &oldFee) != nil {
		fail(c, 404, "Examen no encontrado")
		return
	}
	var resolved, paid bool
	_ = tx.QueryRow(c, `SELECT EXISTS(SELECT 1 FROM exam_entries WHERE exam_id=$1 AND result<>'pending'),
  EXISTS(SELECT 1 FROM exam_entries en JOIN payments p ON p.charge_id=en.charge_id AND p.status='valid' WHERE en.exam_id=$1)`, c.Param("id")).Scan(&resolved, &paid)
	if resolved {
		fail(c, 409, "El examen ya tiene resultados registrados y no se puede editar")
		return
	}
	if fee != oldFee && paid {
		fail(c, 409, "Ya hay pagos de este examen; el costo no se puede cambiar. Anula los pagos primero en Pagos")
		return
	}
	if in.Kind != "" {
		kind = in.Kind
	}
	if _, e = tx.Exec(c, `UPDATE exams SET exam_date=$1,fee_cents=$2,payment_deadline=$3,name=$5,kind=$6 WHERE id=$4`, date, fee, deadline, c.Param("id"), strings.TrimSpace(in.Name), kind); e == nil {
		label := "Examen parcial"
		if kind == "black" {
			label = "Examen de cinta negra"
		}
		_, e = tx.Exec(c, `UPDATE charges SET due_date=$1,period=to_char($2::date,'YYYY-MM'),description=$3,
  original_cents=CASE WHEN $4::bigint<>$5::bigint THEN $4 ELSE original_cents END,
  total_cents=CASE WHEN $4::bigint<>$5::bigint THEN greatest($4-discount_cents,0) ELSE total_cents END
WHERE status='active' AND id IN (SELECT charge_id FROM exam_entries WHERE exam_id=$6 AND charge_id IS NOT NULL)`,
			deadline, date, fmt.Sprintf("%s · %s", label, in.Date), fee, oldFee, c.Param("id"))
	}
	if e != nil || tx.Commit(c) != nil {
		fail(c, 500, "No se pudo guardar el examen")
		return
	}
	c.Status(204)
}

func (s *Server) enrollExam(c *gin.Context) {
	var in struct {
		StudentID string `json:"studentId"`
		Reason    string `json:"reason"`
		Method    string `json:"method"`
	}
	if c.ShouldBindJSON(&in) != nil || in.StudentID == "" {
		fail(c, 400, "Selecciona un alumno")
		return
	}
	method, knownMethod := map[string]string{"": "cash", "Efectivo": "cash", "Transferencia": "transfer", "Tarjeta": "card", "Otro": "other"}[in.Method]
	if !knownMethod {
		fail(c, 400, "Forma de pago inválida")
		return
	}
	school := c.GetString("school")
	tx, e := s.DB.Begin(c)
	if e != nil {
		fail(c, 500, "No se pudo inscribir")
		return
	}
	defer tx.Rollback(c)
	var kind, examDate string
	var fee int64
	var deadline time.Time
	if tx.QueryRow(c, `SELECT kind,exam_date::text,fee_cents,payment_deadline FROM exams WHERE id=$1 AND school_id=$2`, c.Param("id"), school).Scan(&kind, &examDate, &fee, &deadline) != nil {
		fail(c, 404, "Examen no encontrado")
		return
	}
	var name, gradeID string
	var active bool
	if tx.QueryRow(c, `SELECT concat_ws(' ',first_names,last_names),grade_id::text,status='active' FROM students WHERE id=$1 AND school_id=$2`, in.StudentID, school).Scan(&name, &gradeID, &active) != nil || !active {
		fail(c, 400, "El alumno no existe o está inactivo")
		return
	}
	reason := strings.TrimSpace(in.Reason)
	if kind == "black" {
		prog, err := loadProgress(c, tx, school, in.StudentID, store.DemoNow(s.Config))
		p, ok := prog[in.StudentID]
		if err != nil || !ok {
			fail(c, 500, "No se pudo calcular el avance")
			return
		}
		if !p.Eligible {
			fail(c, 400, "Para el examen de cinta negra el alumno debe estar en la última cinta de color o ya tener cinta negra")
			return
		}
		if !p.Progress.Ready && reason == "" {
			fail(c, 400, "Aún no cumple los requisitos ("+strings.Join(p.Progress.Missing, ", ")+"). Escribe el motivo para inscribirlo de todos modos")
			return
		}
	}
	today := store.DemoNow(s.Config).Format("2006-01-02")
	if today >= examDate {
		fail(c, 409, "La inscripción cerró: el examen es hoy o ya pasó")
		return
	}
	var entryID string
	e = tx.QueryRow(c, `INSERT INTO exam_entries(school_id,exam_id,student_id,grade_from_id,override_reason,payment_exception) VALUES($1,$2,$3,$4,nullif($5,''),NULL) RETURNING id::text`, school, c.Param("id"), in.StudentID, gradeID, reason).Scan(&entryID)
	if e != nil {
		fail(c, 409, "El alumno ya está inscrito en este examen")
		return
	}
	label := "Examen parcial"
	if kind == "black" {
		label = "Examen de cinta negra"
	}
	var chargeID string
	e = tx.QueryRow(c, `INSERT INTO charges(school_id,student_id,kind,reference_id,reference_item_id,period,description,original_cents,total_cents,due_date,idempotency_key) VALUES($1,$2,'exam',$3,$4,to_char($5::date,'YYYY-MM'),$6,$7,$7,$9,$8) RETURNING id::text`, school, in.StudentID, c.Param("id"), entryID, examDate, fmt.Sprintf("%s · %s", label, examDate), fee, "exam:"+entryID, deadline).Scan(&chargeID)
	if e == nil {
		_, e = tx.Exec(c, `UPDATE exam_entries SET charge_id=$1 WHERE id=$2`, chargeID, entryID)
	}
	// Inscribirse es pagar: el cobro se liquida en el mismo paso, sin devoluciones.
	if e == nil && fee > 0 {
		var paymentID string
		e = tx.QueryRow(c, `INSERT INTO payments(school_id,student_id,charge_id,amount_cents,received_on,method,observation,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,'Inscripción a examen',$7) RETURNING id::text`, school, in.StudentID, chargeID, fee, today, method, "exam-payment:"+entryID).Scan(&paymentID)
		if e == nil {
			_, e = tx.Exec(c, `INSERT INTO payment_history(school_id,payment_id,action,new_data) VALUES($1,$2,'created',jsonb_build_object('amountCents',$3::bigint))`, school, paymentID, fee)
		}
	}
	if e != nil {
		fail(c, 500, "No se pudo generar el cobro")
		return
	}
	if e = tx.Commit(c); e != nil {
		fail(c, 500, "No se pudo guardar la inscripción")
		return
	}
	c.JSON(201, gin.H{"id": entryID})
}

func (s *Server) removeExamEntry(c *gin.Context) {
	school := c.GetString("school")
	tx, e := s.DB.Begin(c)
	if e != nil {
		fail(c, 500, "No se pudo quitar")
		return
	}
	defer tx.Rollback(c)
	var chargeID *string
	var result string
	if tx.QueryRow(c, `SELECT charge_id::text,result FROM exam_entries WHERE id=$1 AND exam_id=$2 AND school_id=$3 FOR UPDATE`, c.Param("entry"), c.Param("id"), school).Scan(&chargeID, &result) != nil {
		fail(c, 404, "Inscripción no encontrada")
		return
	}
	if result != "pending" {
		fail(c, 409, "El resultado ya fue registrado")
		return
	}
	if chargeID != nil {
		var paid bool
		_ = tx.QueryRow(c, `SELECT EXISTS(SELECT 1 FROM payments WHERE charge_id=$1 AND status='valid')`, *chargeID).Scan(&paid)
		if paid {
			fail(c, 409, "El cobro ya tiene pagos; anúlalos primero en Pagos")
			return
		}
	}
	if _, e = tx.Exec(c, `DELETE FROM exam_entries WHERE id=$1`, c.Param("entry")); e == nil && chargeID != nil {
		_, e = tx.Exec(c, `UPDATE charges SET status='cancelled',cancellation_reason='Alumno retirado del examen' WHERE id=$1`, *chargeID)
	}
	if e != nil || tx.Commit(c) != nil {
		fail(c, 500, "No se pudo quitar al alumno")
		return
	}
	c.Status(204)
}

func (s *Server) setExamResult(c *gin.Context) {
	var in struct {
		Result string `json:"result"`
	}
	if c.ShouldBindJSON(&in) != nil || (in.Result != "passed" && in.Result != "failed") {
		fail(c, 400, "Indica si aprobó o reprobó")
		return
	}
	school := c.GetString("school")
	today := store.DemoNow(s.Config)
	tx, e := s.DB.Begin(c)
	if e != nil {
		fail(c, 500, "No se pudo guardar el resultado")
		return
	}
	defer tx.Rollback(c)
	var kind, result, studentID, gradeID, examDay string
	var exception *string
	var chargeID *string
	if tx.QueryRow(c, `SELECT e.kind,en.result,en.student_id::text,en.grade_from_id::text,en.payment_exception,en.charge_id::text,e.exam_date::text FROM exam_entries en JOIN exams e ON e.id=en.exam_id WHERE en.id=$1 AND en.exam_id=$2 AND en.school_id=$3 FOR UPDATE OF en`, c.Param("entry"), c.Param("id"), school).Scan(&kind, &result, &studentID, &gradeID, &exception, &chargeID, &examDay) != nil {
		fail(c, 404, "Inscripción no encontrada")
		return
	}
	if result != "pending" {
		fail(c, 409, "El resultado ya fue registrado")
		return
	}
	if today.Format("2006-01-02") < examDay {
		fail(c, 409, "El resultado se registra a partir de la fecha del examen")
		return
	}
	if in.Result == "failed" {
		if _, e = tx.Exec(c, `UPDATE exam_entries SET result='failed' WHERE id=$1`, c.Param("entry")); e != nil || tx.Commit(c) != nil {
			fail(c, 500, "No se pudo guardar el resultado")
			return
		}
		c.Status(204)
		return
	}
	prog, err := loadProgress(c, tx, school, studentID, today)
	p, ok := prog[studentID]
	if err != nil || !ok {
		fail(c, 500, "No se pudo calcular el avance")
		return
	}
	var newGrade *string
	countsForDan := false
	switch {
	case kind == "partial" && p.Eligible:
		// Última cinta de color o cinta negra: el parcial suma para el siguiente examen final.
		countsForDan = true
	case kind == "partial":
		var next string
		if tx.QueryRow(c, `SELECT g2.id::text FROM grades g2 WHERE g2.school_id=$1 AND g2.track='color' AND g2.sort_order>(SELECT sort_order FROM grades WHERE id=$2) ORDER BY g2.sort_order LIMIT 1`, school, gradeID).Scan(&next) != nil {
			fail(c, 400, "No hay una cinta siguiente para este alumno")
			return
		}
		newGrade = &next
	default:
		if !p.Eligible {
			fail(c, 400, "El alumno debe estar en la última cinta de color o tener cinta negra")
			return
		}
		var next string
		if tx.QueryRow(c, `SELECT id::text FROM grades WHERE school_id=$1 AND track=$2 AND level=$3`, school, p.Progress.Track, p.Progress.Target).Scan(&next) != nil {
			fail(c, 400, fmt.Sprintf("No existe el grado %s %d en la lista de grados", p.Progress.Track, p.Progress.Target))
			return
		}
		newGrade = &next
	}
	if newGrade != nil {
		if _, e = tx.Exec(c, `UPDATE students SET grade_id=$1,version=version+1,updated_at=now() WHERE id=$2 AND school_id=$3`, *newGrade, studentID, school); e != nil {
			fail(c, 500, "No se pudo actualizar el grado")
			return
		}
	}
	if _, e = tx.Exec(c, `UPDATE exam_entries SET result='passed',grade_to_id=$1,counts_for_dan=$2 WHERE id=$3`, newGrade, countsForDan, c.Param("entry")); e != nil || tx.Commit(c) != nil {
		fail(c, 500, "No se pudo guardar el resultado")
		return
	}
	c.Status(204)
}

// authorizePayment registra que la maestra permite continuar sin el pago del examen.
func (s *Server) authorizePayment(c *gin.Context) {
	var in struct {
		Reason string `json:"reason"`
	}
	if c.ShouldBindJSON(&in) != nil || strings.TrimSpace(in.Reason) == "" {
		fail(c, 400, "Escribe el motivo de la excepción")
		return
	}
	tag, e := s.DB.Exec(c, `UPDATE exam_entries SET payment_exception=$1 WHERE id=$2 AND exam_id=$3 AND school_id=$4 AND result='pending'`, strings.TrimSpace(in.Reason), c.Param("entry"), c.Param("id"), c.GetString("school"))
	if e != nil || tag.RowsAffected() == 0 {
		fail(c, 404, "Inscripción no encontrada o con resultado ya registrado")
		return
	}
	c.Status(204)
}
