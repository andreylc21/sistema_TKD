package app

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"sistema-tkd/backend/internal/clases"
	"sistema-tkd/backend/internal/store"
)

func (s *Server) createGroup(c *gin.Context) {
	var in struct {
		Name   string   `json:"name"`
		Days   []string `json:"days"`
		Start  string   `json:"start"`
		End    string   `json:"end"`
		MinAge *int     `json:"minAge"`
		MaxAge *int     `json:"maxAge"`
	}
	if c.ShouldBindJSON(&in) != nil || clases.ValidateGroup(in.Name, in.Days, in.Start, in.End) != nil || clases.ValidateAgeRange(in.MinAge, in.MaxAge) != nil {
		fail(c, 400, "Completa nombre, días y horario")
		return
	}
	tx, e := s.DB.Begin(c)
	if e != nil {
		fail(c, 500, "No se pudo crear el grupo")
		return
	}
	defer tx.Rollback(c)
	key := idem(c)
	if existing, replayed, err := reserveIdempotency(c, tx, c.GetString("school"), key, "createGroup"); err != nil {
		fail(c, http.StatusConflict, err.Error())
		return
	} else if replayed {
		c.JSON(http.StatusOK, gin.H{"id": existing, "replayed": true})
		return
	}
	var id string
	e = tx.QueryRow(c, `INSERT INTO class_groups(school_id,name,days,start_time,end_time,min_age,max_age) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id::text`, c.GetString("school"), in.Name, in.Days, in.Start, in.End, in.MinAge, in.MaxAge).Scan(&id)
	if e == nil {
		e = completeIdempotency(c, tx, c.GetString("school"), key, "createGroup", id)
	}
	if e != nil {
		fail(c, 400, "No se pudo crear el grupo")
		return
	}
	if e = tx.Commit(c); e != nil {
		fail(c, 500, "No se pudo guardar el grupo")
		return
	}
	c.JSON(201, gin.H{"id": id})
}

func (s *Server) updateGroup(c *gin.Context) {
	var in struct {
		Name    string   `json:"name"`
		Days    []string `json:"days"`
		Start   string   `json:"start"`
		End     string   `json:"end"`
		MinAge  *int     `json:"minAge"`
		MaxAge  *int     `json:"maxAge"`
		Version int      `json:"version"`
	}
	if c.ShouldBindJSON(&in) != nil || clases.ValidateGroup(in.Name, in.Days, in.Start, in.End) != nil || clases.ValidateAgeRange(in.MinAge, in.MaxAge) != nil || in.Version < 1 {
		fail(c, 400, "Completa nombre, días y horario")
		return
	}
	tag, e := s.DB.Exec(c, `UPDATE class_groups SET name=$1,days=$2,start_time=$3,end_time=$4,min_age=$8,max_age=$9,version=version+1,updated_at=now() WHERE id=$5 AND school_id=$6 AND version=$7`, in.Name, in.Days, in.Start, in.End, c.Param("id"), c.GetString("school"), in.Version, in.MinAge, in.MaxAge)
	if e != nil {
		fail(c, 400, "No se pudo actualizar el grupo")
		return
	}
	if tag.RowsAffected() == 0 {
		fail(c, 409, errConflict.Error())
		return
	}
	c.Status(204)
}

func (s *Server) assignStudent(c *gin.Context) {
	var in struct {
		StudentID    string `json:"studentId"`
		AssignedFrom string `json:"assignedFrom"`
	}
	if c.ShouldBindJSON(&in) != nil || in.AssignedFrom == "" {
		fail(c, 400, "Alumno y fecha son obligatorios")
		return
	}
	_, e := s.DB.Exec(c, `INSERT INTO group_assignments(school_id,group_id,student_id,assigned_from,age_kept) SELECT $1,g.id,st.id,$4,((g.min_age IS NOT NULL AND date_part('year',age($4::date,st.birth_date))<g.min_age) OR (g.max_age IS NOT NULL AND date_part('year',age($4::date,st.birth_date))>g.max_age)) FROM class_groups g JOIN students st ON st.id=$3 AND st.school_id=$1 WHERE g.id=$2 AND g.school_id=$1 AND g.archived_at IS NULL ON CONFLICT DO NOTHING`, c.GetString("school"), c.Param("id"), in.StudentID, in.AssignedFrom)
	if e != nil {
		fail(c, 400, "No se pudo asignar el alumno")
		return
	}
	c.Status(204)
}

func (s *Server) createSession(c *gin.Context) {
	var in struct {
		GroupID string `json:"groupId"`
		Date    string `json:"date"`
		Start   string `json:"start"`
		End     string `json:"end"`
	}
	if c.ShouldBindJSON(&in) != nil || in.GroupID == "" || in.Date == "" {
		fail(c, 400, "Grupo, fecha y horario son obligatorios")
		return
	}
	tx, e := s.DB.Begin(c)
	if e != nil {
		fail(c, 500, "No se pudo crear la sesión")
		return
	}
	defer tx.Rollback(c)
	var id string
	e = tx.QueryRow(c, `INSERT INTO class_sessions(school_id,group_id,session_date,start_time,end_time,started_at) SELECT $1,g.id,$3,$4,$5,now() FROM class_groups g WHERE g.id=$2 AND g.school_id=$1 AND g.archived_at IS NULL ON CONFLICT(school_id,group_id,session_date) DO UPDATE SET group_id=EXCLUDED.group_id,started_at=CASE WHEN class_sessions.status='scheduled' THEN coalesce(class_sessions.started_at,now()) ELSE now() END,ended_at=CASE WHEN class_sessions.status='scheduled' THEN class_sessions.ended_at ELSE NULL END,status='scheduled',version=class_sessions.version+(CASE WHEN class_sessions.status='scheduled' THEN 0 ELSE 1 END) RETURNING id::text`, c.GetString("school"), in.GroupID, in.Date, in.Start, in.End).Scan(&id)
	if e == nil {
		_, e = tx.Exec(c, `INSERT INTO session_participants(school_id,session_id,student_id) SELECT $1,$2,a.student_id FROM group_assignments a WHERE a.group_id=$3 AND a.assigned_from<=$4 AND (a.assigned_to IS NULL OR a.assigned_to>=$4) ON CONFLICT(session_id,student_id) DO NOTHING`, c.GetString("school"), id, in.GroupID, in.Date)
	}
	if e != nil {
		fail(c, 400, "No se pudo crear la sesión")
		return
	}
	if e = tx.Commit(c); e != nil {
		fail(c, 500, "No se pudo guardar")
		return
	}
	c.JSON(201, gin.H{"id": id})
}
func (s *Server) inviteParticipant(c *gin.Context) {
	var in struct {
		StudentID string `json:"studentId"`
	}
	if c.ShouldBindJSON(&in) != nil {
		fail(c, 400, "Alumno inválido")
		return
	}
	tag, e := s.DB.Exec(c, `INSERT INTO session_participants(school_id,session_id,student_id,temporary) SELECT $1,cs.id,st.id,true FROM class_sessions cs JOIN students st ON st.id=$3 AND st.school_id=$1 WHERE cs.id=$2 AND cs.school_id=$1 AND cs.status='scheduled' AND cs.ended_at IS NULL AND (cs.started_at IS NULL OR now() < cs.started_at+(cs.end_time-cs.start_time)) ON CONFLICT(session_id,student_id) DO NOTHING`, c.GetString("school"), c.Param("id"), in.StudentID)
	if e != nil {
		fail(c, 400, "No se pudo invitar")
		return
	}
	if tag.RowsAffected() == 0 {
		fail(c, 409, "La clase no admite nuevos participantes o el alumno ya está incluido")
		return
	}
	c.Status(204)
}
func (s *Server) attendance(c *gin.Context) {
	var in struct {
		Status      string `json:"status"`
		Observation string `json:"observation"`
		Version     int    `json:"version"`
	}
	if c.ShouldBindJSON(&in) != nil || clases.AttendanceCode(in.Status) == "" {
		fail(c, 400, "Asistencia inválida")
		return
	}
	tag, e := s.DB.Exec(c, `UPDATE session_participants p SET attendance_status=$1,observation=$2,version=p.version+1 WHERE p.school_id=$3 AND p.session_id=$4 AND p.student_id=$5 AND p.version=$6 AND EXISTS(SELECT 1 FROM class_sessions cs WHERE cs.id=p.session_id AND cs.school_id=$3 AND cs.status='scheduled' AND cs.ended_at IS NULL AND (cs.started_at IS NULL OR now() < cs.started_at+(cs.end_time-cs.start_time)))`, clases.AttendanceCode(in.Status), in.Observation, c.GetString("school"), c.Param("id"), c.Param("student"), in.Version)
	if e != nil || tag.RowsAffected() == 0 {
		fail(c, 409, "La asistencia cambió o la clase ya no admite cambios; recarga")
		return
	}
	c.Status(204)
}
func (s *Server) sessionStatus(c *gin.Context) {
	var in struct {
		Status  string `json:"status"`
		Version int    `json:"version"`
		Date    string `json:"date"`
		Start   string `json:"start"`
		End     string `json:"end"`
	}
	if c.ShouldBindJSON(&in) != nil || (in.Status != "Cancelada" && in.Status != "Reprogramada") {
		fail(c, 400, "Estado inválido")
		return
	}
	tx, e := s.DB.Begin(c)
	if e != nil {
		fail(c, 500, "No se pudo actualizar")
		return
	}
	defer tx.Rollback(c)
	var group string
	var start, end string
	e = tx.QueryRow(c, `SELECT group_id::text,start_time::text,end_time::text FROM class_sessions WHERE id=$1 AND school_id=$2 AND version=$3 FOR UPDATE`, c.Param("id"), c.GetString("school"), in.Version).Scan(&group, &start, &end)
	if e != nil {
		fail(c, 409, "La sesión cambió; recarga")
		return
	}
	if in.Status == "Cancelada" {
		_, e = tx.Exec(c, `UPDATE class_sessions SET status='cancelled',version=version+1,updated_at=now() WHERE id=$1`, c.Param("id"))
	} else {
		if in.Date == "" {
			fail(c, 400, "Indica la nueva fecha")
			return
		}
		if in.Start == "" {
			in.Start = start
		}
		if in.End == "" {
			in.End = end
		}
		_, e = tx.Exec(c, `UPDATE class_sessions SET status='rescheduled',version=version+1,updated_at=now() WHERE id=$1`, c.Param("id"))
		if e == nil {
			var newID string
			e = tx.QueryRow(c, `INSERT INTO class_sessions(school_id,group_id,session_date,start_time,end_time,status,rescheduled_from_id) VALUES($1,$2,$3,$4,$5,'scheduled',$6) RETURNING id::text`, c.GetString("school"), group, in.Date, in.Start, in.End, c.Param("id")).Scan(&newID)
			if e == nil {
				_, e = tx.Exec(c, `INSERT INTO session_participants(school_id,session_id,student_id,temporary) SELECT school_id,$1,student_id,temporary FROM session_participants WHERE session_id=$2 ON CONFLICT DO NOTHING`, newID, c.Param("id"))
			}
		}
	}
	if e != nil {
		fail(c, 400, "No se pudo actualizar la sesión")
		return
	}
	if e = tx.Commit(c); e != nil {
		fail(c, 500, "No se pudo guardar")
		return
	}
	c.Status(204)
}

// moveStudent saca al alumno del grupo desde una fecha y, si se indica, lo pasa a otro grupo.
// Las clases ya programadas conservan sus participantes: sólo cambia la pertenencia futura.
func (s *Server) moveStudent(c *gin.Context) {
	var in struct {
		StudentID string `json:"studentId"`
		ToGroupID string `json:"toGroupId"`
		Date      string `json:"date"`
	}
	if c.ShouldBindJSON(&in) != nil || in.StudentID == "" || in.Date == "" {
		fail(c, 400, "Alumno y fecha son obligatorios")
		return
	}
	school := c.GetString("school")
	tx, e := s.DB.Begin(c)
	if e != nil {
		fail(c, 500, "No se pudo mover al alumno")
		return
	}
	defer tx.Rollback(c)
	tag, e := tx.Exec(c, `DELETE FROM group_assignments WHERE school_id=$1 AND group_id=$2 AND student_id=$3 AND assigned_to IS NULL AND assigned_from>=$4`, school, c.Param("id"), in.StudentID, in.Date)
	if e == nil && tag.RowsAffected() == 0 {
		tag, e = tx.Exec(c, `UPDATE group_assignments SET assigned_to=$4::date-1 WHERE school_id=$1 AND group_id=$2 AND student_id=$3 AND assigned_to IS NULL`, school, c.Param("id"), in.StudentID, in.Date)
	}
	if e != nil || tag.RowsAffected() == 0 {
		fail(c, 404, "El alumno no está asignado a este grupo")
		return
	}
	if in.ToGroupID != "" {
		_, e = tx.Exec(c, `INSERT INTO group_assignments(school_id,group_id,student_id,assigned_from,age_kept) SELECT $1,g.id,st.id,$4,((g.min_age IS NOT NULL AND date_part('year',age($4::date,st.birth_date))<g.min_age) OR (g.max_age IS NOT NULL AND date_part('year',age($4::date,st.birth_date))>g.max_age)) FROM class_groups g JOIN students st ON st.id=$3 AND st.school_id=$1 WHERE g.id=$2 AND g.school_id=$1 ON CONFLICT DO NOTHING`, school, in.ToGroupID, in.StudentID, in.Date)
		if e != nil {
			fail(c, 400, "No se pudo asignar al nuevo grupo")
			return
		}
	}
	if e = tx.Commit(c); e != nil {
		fail(c, 500, "No se pudo guardar el cambio")
		return
	}
	c.Status(204)
}

// keepStudent registra que la maestra decidió dejar al alumno en el grupo aunque salga del rango de edad.
func (s *Server) keepStudent(c *gin.Context) {
	var in struct {
		StudentID string `json:"studentId"`
	}
	if c.ShouldBindJSON(&in) != nil || in.StudentID == "" {
		fail(c, 400, "Selecciona un alumno")
		return
	}
	tag, e := s.DB.Exec(c, `UPDATE group_assignments SET age_kept=true WHERE school_id=$1 AND group_id=$2 AND student_id=$3 AND assigned_to IS NULL`, c.GetString("school"), c.Param("id"), in.StudentID)
	if e != nil || tag.RowsAffected() == 0 {
		fail(c, 404, "El alumno no está asignado a este grupo")
		return
	}
	c.Status(204)
}

// archiveGroup oculta el grupo sin borrar su historial y saca de él a sus alumnos desde hoy.
func (s *Server) archiveGroup(c *gin.Context) {
	var in struct {
		Version int `json:"version"`
	}
	if c.ShouldBindJSON(&in) != nil || in.Version < 1 {
		fail(c, 400, "Versión inválida")
		return
	}
	school := c.GetString("school")
	today := store.DemoNow(s.Config).Format("2006-01-02")
	tx, e := s.DB.Begin(c)
	if e != nil {
		fail(c, 500, "No se pudo archivar el grupo")
		return
	}
	defer tx.Rollback(c)
	tag, e := tx.Exec(c, `UPDATE class_groups SET archived_at=now(),version=version+1,updated_at=now() WHERE id=$1 AND school_id=$2 AND version=$3 AND archived_at IS NULL`, c.Param("id"), school, in.Version)
	if e != nil {
		fail(c, 500, "No se pudo archivar el grupo")
		return
	}
	if tag.RowsAffected() == 0 {
		fail(c, 409, errConflict.Error())
		return
	}
	if _, e = tx.Exec(c, `DELETE FROM group_assignments WHERE school_id=$1 AND group_id=$2 AND assigned_to IS NULL AND assigned_from>=$3`, school, c.Param("id"), today); e == nil {
		_, e = tx.Exec(c, `UPDATE group_assignments SET assigned_to=$3::date-1 WHERE school_id=$1 AND group_id=$2 AND assigned_to IS NULL`, school, c.Param("id"), today)
	}
	if e != nil {
		fail(c, 500, "No se pudo sacar a los alumnos del grupo")
		return
	}
	if e = tx.Commit(c); e != nil {
		fail(c, 500, "No se pudo guardar el cambio")
		return
	}
	c.Status(204)
}

func (s *Server) restoreGroup(c *gin.Context) {
	var in struct {
		Version int `json:"version"`
	}
	if c.ShouldBindJSON(&in) != nil || in.Version < 1 {
		fail(c, 400, "Versión inválida")
		return
	}
	tag, e := s.DB.Exec(c, `UPDATE class_groups SET archived_at=NULL,version=version+1,updated_at=now() WHERE id=$1 AND school_id=$2 AND version=$3 AND archived_at IS NOT NULL`, c.Param("id"), c.GetString("school"), in.Version)
	if e != nil {
		fail(c, 500, "No se pudo restaurar el grupo")
		return
	}
	if tag.RowsAffected() == 0 {
		fail(c, 409, errConflict.Error())
		return
	}
	c.Status(204)
}

// deleteGroup solo borra grupos que nunca tuvieron clases; los demás se archivan.
func (s *Server) deleteGroup(c *gin.Context) {
	tag, e := s.DB.Exec(c, `DELETE FROM class_groups g WHERE g.id=$1 AND g.school_id=$2 AND NOT EXISTS (SELECT 1 FROM class_sessions x WHERE x.group_id=g.id)`, c.Param("id"), c.GetString("school"))
	if e != nil {
		fail(c, 500, "No se pudo borrar el grupo")
		return
	}
	if tag.RowsAffected() == 0 {
		fail(c, 409, "El grupo ya tiene clases registradas; archívalo en su lugar")
		return
	}
	c.Status(204)
}

// finishSession termina la clase: guarda la hora de fin y ya no admite cambios de asistencia.
func (s *Server) finishSession(c *gin.Context) {
	tag, e := s.DB.Exec(c, `UPDATE class_sessions SET ended_at=now(),started_at=coalesce(started_at,now()),version=version+1,updated_at=now() WHERE id=$1 AND school_id=$2 AND status='scheduled' AND ended_at IS NULL`, c.Param("id"), c.GetString("school"))
	if e != nil {
		fail(c, 500, "No se pudo terminar la clase")
		return
	}
	if tag.RowsAffected() == 0 {
		fail(c, 409, "La clase ya terminó o no se puede terminar")
		return
	}
	c.Status(204)
}
