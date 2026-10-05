package app

import (
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"sistema-tkd/backend/internal/alumnos"
	"sistema-tkd/backend/internal/store"
)

func (s *Server) createStudent(c *gin.Context) {
	var in alumnos.StudentInput
	if c.ShouldBindJSON(&in) != nil || alumnos.ValidateStudent(in, store.DemoNow(s.Config)) != nil {
		fail(c, 400, "Revisa los datos del alumno")
		return
	}
	tx, e := s.DB.Begin(c)
	if e != nil {
		fail(c, 500, "No se pudo guardar")
		return
	}
	defer tx.Rollback(c)
	key := idem(c)
	if existing, replayed, err := reserveIdempotency(c, tx, c.GetString("school"), key, "createStudent"); err != nil {
		fail(c, http.StatusConflict, err.Error())
		return
	} else if replayed {
		c.JSON(http.StatusOK, gin.H{"id": existing, "replayed": true})
		return
	}
	var id string
	e = tx.QueryRow(c, `INSERT INTO students(school_id,first_names,last_names,birth_date,grade_id,email,email_owner,primary_contact_name,primary_contact_relation,primary_contact_phone,emergency_contact_name,emergency_contact_relation,emergency_contact_phone,restrictions,health_consent_simulated,enrollment_date,billing_day) SELECT $1,$2,$3,$4,g.id,$6,nullif($7,''),$8,$9,$10,$11,$12,$13,$14,$15,$16,$17 FROM grades g WHERE g.id=$5 AND g.school_id=$1 RETURNING id::text`, c.GetString("school"), in.FirstNames, in.LastNames, in.BirthDate, in.GradeID, in.Email, in.EmailOwner, in.PrimaryName, in.PrimaryRelation, in.PrimaryPhone, in.EmergencyName, in.EmergencyRelation, in.EmergencyPhone, in.Restrictions, in.HealthConsent, in.EnrollmentDate, in.BillingDay).Scan(&id)
	if e == nil {
		_, e = tx.Exec(c, `INSERT INTO student_activity_periods(school_id,student_id,active_from) VALUES($1,$2,$3)`, c.GetString("school"), id, in.EnrollmentDate)
	}
	if e == nil {
		e = completeIdempotency(c, tx, c.GetString("school"), key, "createStudent", id)
	}
	if e != nil {
		fail(c, 400, "No se pudo crear el alumno")
		return
	}
	if e = tx.Commit(c); e != nil {
		fail(c, 500, "No se pudo guardar")
		return
	}
	s.chargeStudentNow(c, id)
	c.JSON(201, gin.H{"id": id})
}

// chargeStudentNow genera la mensualidad sin esperar al ciclo diario; un fallo no revierte el alta.
func (s *Server) chargeStudentNow(c *gin.Context, studentID string) {
	if err := s.generateMonthlyCharges(c, store.DemoNow(s.Config), studentID); err != nil {
		log.Printf("monthly charges for %s: %v", studentID, err)
	}
}
func (s *Server) updateStudent(c *gin.Context) {
	var in alumnos.StudentInput
	if c.ShouldBindJSON(&in) != nil || alumnos.ValidateStudent(in, store.DemoNow(s.Config)) != nil {
		fail(c, 400, "Revisa los datos")
		return
	}
	tag, e := s.DB.Exec(c, `UPDATE students SET first_names=$1,last_names=$2,birth_date=$3,grade_id=(SELECT id FROM grades WHERE id=$4 AND school_id=$5),email=$6,email_owner=nullif($7,''),primary_contact_name=$8,primary_contact_relation=$9,primary_contact_phone=$10,emergency_contact_name=$11,emergency_contact_relation=$12,emergency_contact_phone=$13,restrictions=$14,health_consent_simulated=$15,billing_day=$16,version=version+1,updated_at=now() WHERE id=$17 AND school_id=$5 AND version=$18`, in.FirstNames, in.LastNames, in.BirthDate, in.GradeID, c.GetString("school"), in.Email, in.EmailOwner, in.PrimaryName, in.PrimaryRelation, in.PrimaryPhone, in.EmergencyName, in.EmergencyRelation, in.EmergencyPhone, in.Restrictions, in.HealthConsent, in.BillingDay, c.Param("id"), in.Version)
	if e != nil {
		fail(c, 400, "No se pudo actualizar")
		return
	}
	if tag.RowsAffected() == 0 {
		fail(c, 409, errConflict.Error())
		return
	}
	c.Status(204)
}
func (s *Server) studentStatus(c *gin.Context) {
	var in struct {
		Status  string `json:"status"`
		Date    string `json:"date"`
		Version int    `json:"version"`
	}
	if c.ShouldBindJSON(&in) != nil || (in.Status != "active" && in.Status != "inactive") {
		fail(c, 400, "Estado inválido")
		return
	}
	tx, e := s.DB.Begin(c)
	if e != nil {
		fail(c, 500, "No se pudo actualizar")
		return
	}
	defer tx.Rollback(c)
	tag, e := tx.Exec(c, `UPDATE students SET status=$1,inactive_at=CASE WHEN $1='inactive' THEN $2::date ELSE NULL END,billing_restart_date=CASE WHEN $1='active' THEN $2::date ELSE billing_restart_date END,version=version+1,updated_at=now() WHERE id=$3 AND school_id=$4 AND version=$5`, in.Status, in.Date, c.Param("id"), c.GetString("school"), in.Version)
	if e != nil || tag.RowsAffected() == 0 {
		fail(c, 409, "El registro cambió; recarga la pantalla")
		return
	}
	if in.Status == "inactive" {
		_, e = tx.Exec(c, `UPDATE student_activity_periods SET active_to=$1 WHERE student_id=$2 AND active_to IS NULL`, in.Date, c.Param("id"))
	} else {
		_, e = tx.Exec(c, `INSERT INTO student_activity_periods(school_id,student_id,active_from) VALUES($1,$2,$3)`, c.GetString("school"), c.Param("id"), in.Date)
	}
	if e != nil {
		fail(c, 400, "No se pudo actualizar el periodo")
		return
	}
	if e = tx.Commit(c); e != nil {
		fail(c, 500, "No se pudo guardar el cambio de estado")
		return
	}
	if in.Status == "active" {
		s.chargeStudentNow(c, c.Param("id"))
	}
	c.Status(204)
}
func (s *Server) createNote(c *gin.Context) {
	var in struct {
		Date      string `json:"date"`
		Topic     string `json:"topic"`
		Text      string `json:"text"`
		SessionID string `json:"sessionId"`
	}
	if c.ShouldBindJSON(&in) != nil || in.Topic == "" || in.Text == "" {
		fail(c, 400, "Aspecto trabajado y contenido son obligatorios")
		return
	}
	tx, e := s.DB.Begin(c)
	if e != nil {
		fail(c, 500, "No se pudo guardar la nota")
		return
	}
	defer tx.Rollback(c)
	key := idem(c)
	if existing, replayed, err := reserveIdempotency(c, tx, c.GetString("school"), key, "createNote"); err != nil {
		fail(c, http.StatusConflict, err.Error())
		return
	} else if replayed {
		c.JSON(http.StatusOK, gin.H{"id": existing, "replayed": true})
		return
	}
	var id string
	e = tx.QueryRow(c, `INSERT INTO student_notes(school_id,student_id,session_id,note_date,topic,observation) SELECT $1,s.id,nullif($3,'')::uuid,$4,$5,$6 FROM students s WHERE s.id=$2 AND s.school_id=$1 AND ($3='' OR EXISTS(SELECT 1 FROM class_sessions cs WHERE cs.id=$3::uuid AND cs.school_id=$1)) RETURNING id::text`, c.GetString("school"), c.Param("id"), in.SessionID, in.Date, strings.TrimSpace(in.Topic), strings.TrimSpace(in.Text)).Scan(&id)
	if e == nil {
		e = completeIdempotency(c, tx, c.GetString("school"), key, "createNote", id)
	}
	if e != nil {
		fail(c, 400, "No se pudo guardar la nota")
		return
	}
	if e = tx.Commit(c); e != nil {
		fail(c, 500, "No se pudo confirmar la nota")
		return
	}
	c.JSON(201, gin.H{"id": id})
}

func (s *Server) updateNote(c *gin.Context) {
	var in struct {
		Date      string `json:"date"`
		Topic     string `json:"topic"`
		Text      string `json:"text"`
		SessionID string `json:"sessionId"`
		Version   int    `json:"version"`
	}
	if c.ShouldBindJSON(&in) != nil || strings.TrimSpace(in.Topic) == "" || strings.TrimSpace(in.Text) == "" || in.Version < 1 {
		fail(c, 400, "Revisa la nota")
		return
	}
	tag, e := s.DB.Exec(c, `UPDATE student_notes SET note_date=$1,topic=$2,observation=$3,session_id=CASE WHEN $4='' THEN session_id ELSE $4::uuid END,version=version+1,updated_at=now() WHERE id=$5 AND school_id=$6 AND version=$7 AND ($4='' OR EXISTS(SELECT 1 FROM class_sessions cs WHERE cs.id=$4::uuid AND cs.school_id=$6))`, in.Date, strings.TrimSpace(in.Topic), strings.TrimSpace(in.Text), in.SessionID, c.Param("id"), c.GetString("school"), in.Version)
	if e != nil {
		fail(c, 400, "No se pudo actualizar la nota")
		return
	}
	if tag.RowsAffected() == 0 {
		fail(c, 409, errConflict.Error())
		return
	}
	c.Status(204)
}

func (s *Server) deleteNote(c *gin.Context) {
	version := c.Query("version")
	if version == "" {
		fail(c, 400, "Falta la versión del registro")
		return
	}
	tag, e := s.DB.Exec(c, `DELETE FROM student_notes WHERE id=$1 AND school_id=$2 AND version=$3`, c.Param("id"), c.GetString("school"), version)
	if e != nil {
		fail(c, 400, "No se pudo eliminar la nota")
		return
	}
	if tag.RowsAffected() == 0 {
		fail(c, 409, errConflict.Error())
		return
	}
	c.Status(204)
}
