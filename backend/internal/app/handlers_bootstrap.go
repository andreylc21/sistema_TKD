package app

import (
	"encoding/json"
	"strings"

	"github.com/gin-gonic/gin"
	"sistema-tkd/backend/internal/store"
)

func (s *Server) jsonQuery(c *gin.Context, q string, args ...any) (json.RawMessage, error) {
	var b []byte
	if err := s.DB.QueryRow(c, q, args...).Scan(&b); err != nil {
		return nil, err
	}
	return b, nil
}
func fail(c *gin.Context, code int, msg string) { c.JSON(code, gin.H{"error": msg}) }
func idem(c *gin.Context) string {
	v := strings.TrimSpace(c.GetHeader("Idempotency-Key"))
	if v == "" {
		v = randomToken()
	}
	return v
}

func (s *Server) bootstrap(c *gin.Context) {
	school := c.GetString("school")
	now := store.DemoNow(s.Config).Format("2006-01-02")
	var name, owner string
	var fee int64
	if err := s.DB.QueryRow(c, `SELECT sc.name,u.owner_name,sc.monthly_fee_cents FROM schools sc JOIN users u ON u.school_id=sc.id WHERE sc.id=$1 LIMIT 1`, school).Scan(&name, &owner, &fee); err != nil {
		fail(c, 500, "No se pudo consultar la escuela")
		return
	}
	var queryErr error
	load := func(query string, args ...any) json.RawMessage {
		if queryErr != nil {
			return nil
		}
		var value json.RawMessage
		value, queryErr = s.jsonQuery(c, query, args...)
		return value
	}
	students := load(`SELECT coalesce(jsonb_agg(x ORDER BY x.name),'[]') FROM (SELECT s.id::text,concat_ws(' ',s.first_names,s.last_names) name,s.first_names "firstNames",s.last_names "lastNames",s.birth_date "birthDate",date_part('year',age($2::date,s.birth_date))::int age,(date_part('year',age($2::date,s.birth_date))<18) minor,g.name grade,g.id::text "gradeId",CASE s.status WHEN 'active' THEN 'Activo' ELSE 'Inactivo' END status,coalesce(s.email,'') email,coalesce(s.email_owner,'') "emailOwner",concat_ws(' · ',s.primary_contact_name,s.primary_contact_relation,s.primary_contact_phone) "primary",s.primary_contact_name "primaryName",s.primary_contact_relation "primaryRelation",s.primary_contact_phone "primaryPhone",concat_ws(' · ',s.emergency_contact_name,s.emergency_contact_relation,s.emergency_contact_phone) emergency,s.emergency_contact_name "emergencyName",s.emergency_contact_relation "emergencyRelation",s.emergency_contact_phone "emergencyPhone",coalesce(s.restrictions,'') restrictions,s.health_consent_simulated "healthConsent",s.enrollment_date "enrollmentDate",s.billing_day "billingDay",s.version,coalesce((SELECT jsonb_agg(ga.group_id::text) FROM group_assignments ga WHERE ga.student_id=s.id AND ga.assigned_to IS NULL),'[]') groups,coalesce((SELECT jsonb_agg(n.id::text) FROM student_notes n WHERE n.student_id=s.id),'[]') notes FROM students s JOIN grades g ON g.id=s.grade_id WHERE s.school_id=$1) x`, school, now)
	notes := load(`SELECT coalesce(jsonb_agg(jsonb_build_object('id',id::text,'studentId',student_id::text,'date',note_date,'topic',topic,'text',observation,'sessionId',session_id::text,'version',version) ORDER BY note_date DESC),'[]') FROM student_notes WHERE school_id=$1`, school)
	groups := load(`SELECT coalesce(jsonb_agg(jsonb_build_object('id',g.id::text,'name',g.name,'days',g.days,'time',to_char(g.start_time,'HH24:MI')||'–'||to_char(g.end_time,'HH24:MI'),'version',g.version,'students',coalesce((SELECT jsonb_agg(a.student_id::text) FROM group_assignments a WHERE a.group_id=g.id AND a.assigned_to IS NULL),'[]')) ORDER BY g.name),'[]') FROM class_groups g WHERE g.school_id=$1`, school)
	sessions := load(`SELECT coalesce(jsonb_agg(jsonb_build_object('id',cs.id::text,'groupId',cs.group_id::text,'date',cs.session_date,'time',to_char(cs.start_time,'HH24:MI')||'–'||to_char(cs.end_time,'HH24:MI'),'status',CASE cs.status WHEN 'cancelled' THEN 'Cancelada' WHEN 'rescheduled' THEN 'Reprogramada' ELSE 'Programada' END,'version',cs.version,'attendance',coalesce((SELECT jsonb_agg(jsonb_build_object('studentId',p.student_id::text,'status',CASE p.attendance_status WHEN 'present' THEN 'Presente' WHEN 'absent' THEN 'Ausente' WHEN 'justified' THEN 'Falta justificada' ELSE 'Sin registrar' END,'observation',coalesce(p.observation,''),'temporary',p.temporary,'version',p.version)) FROM session_participants p WHERE p.session_id=cs.id),'[]')) ORDER BY cs.session_date),'[]') FROM class_sessions cs WHERE cs.school_id=$1`, school)
	charges := load(`SELECT coalesce(jsonb_agg(jsonb_build_object('id',id::text,'studentId',student_id::text,'concept',description,'category',CASE kind WHEN 'monthly' THEN 'Mensualidades' WHEN 'exam' THEN 'Exámenes' ELSE 'Pedidos' END,'original',original_cents/100.0,'discount',discount_cents/100.0,'total',total_cents/100.0,'due',due_date) ORDER BY due_date),'[]') FROM charges WHERE school_id=$1 AND status='active'`, school)
	payments := load(`SELECT coalesce(jsonb_agg(jsonb_build_object('id',id::text,'studentId',student_id::text,'chargeId',charge_id::text,'date',received_on,'amount',amount_cents/100.0,'method',CASE method WHEN 'cash' THEN 'Efectivo' WHEN 'transfer' THEN 'Transferencia' WHEN 'card' THEN 'Tarjeta' WHEN 'other' THEN 'Otro' ELSE 'Sin especificar' END,'valid',status='valid','reason',coalesce(observation,''),'version',version) ORDER BY received_on DESC),'[]') FROM payments WHERE school_id=$1`, school)
	orders := load(`SELECT coalesce(jsonb_agg(jsonb_build_object('id',o.code,'uuid',o.id::text,'studentId',o.student_id::text,'version',o.version,'total',coalesce((SELECT sum(i.quantity*i.unit_price_cents)/100.0 FROM order_items i WHERE i.order_id=o.id AND NOT i.cancelled),0),'paid',coalesce((SELECT sum(p.amount_cents)/100.0 FROM payments p JOIN charges ch ON ch.id=p.charge_id WHERE ch.reference_id=o.id AND p.status='valid'),0),'status','En seguimiento','items',coalesce((SELECT jsonb_agg(jsonb_build_object('id',i.id::text,'name',i.name,'size',coalesce(i.size,''),'quantity',i.quantity,'received',i.received_quantity,'delivered',i.delivered_quantity,'price',i.unit_price_cents/100.0,'requested',i.requested_to_supplier,'cancelled',i.cancelled,'version',i.version)) FROM order_items i WHERE i.order_id=o.id),'[]')) ORDER BY o.created_at DESC),'[]') FROM orders o WHERE o.school_id=$1`, school)
	grades := load(`SELECT coalesce(jsonb_agg(jsonb_build_object('id',id::text,'name',name) ORDER BY sort_order),'[]') FROM grades WHERE school_id=$1`, school)
	if queryErr != nil {
		fail(c, 500, "No se pudieron consultar los datos")
		return
	}
	c.JSON(200, gin.H{"school": gin.H{"name": name, "owner": owner, "fee": float64(fee) / 100}, "demoDate": now, "demoMode": s.Config.DemoMode, "csrfToken": c.GetString("csrf"), "students": students, "notes": notes, "groups": groups, "sessions": sessions, "charges": charges, "payments": payments, "orders": orders, "grades": grades})
}
