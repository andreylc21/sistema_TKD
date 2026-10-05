package app

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"sistema-tkd/backend/internal/pagos"
)

func (s *Server) createPayment(c *gin.Context) {
	var in struct {
		ChargeID    string `json:"chargeId"`
		Amount      string `json:"amount"`
		Date        string `json:"date"`
		Method      string `json:"method"`
		Observation string `json:"observation"`
	}
	if c.ShouldBindJSON(&in) != nil {
		fail(c, 400, "Datos inválidos")
		return
	}
	amount, e := pagos.ParseMoney(in.Amount)
	if e != nil || amount <= 0 {
		fail(c, 400, "Importe inválido")
		return
	}
	method, knownMethod := map[string]string{"Efectivo": "cash", "Transferencia": "transfer", "Tarjeta": "card", "Otro": "other", "": ""}[in.Method]
	if !knownMethod {
		fail(c, 400, "Forma de pago inválida")
		return
	}
	key := idem(c)
	tx, e := s.DB.Begin(c)
	if e != nil {
		fail(c, 500, "No se pudo registrar")
		return
	}
	defer tx.Rollback(c)
	// Bloquear el cargo serializa pagos simultáneos y evita superar el saldo.
	var locked string
	if tx.QueryRow(c, `SELECT id::text FROM charges WHERE id=$1 AND school_id=$2 FOR UPDATE`, in.ChargeID, c.GetString("school")).Scan(&locked) != nil {
		fail(c, 400, "Cargo no encontrado")
		return
	}
	var existing string
	if tx.QueryRow(c, `SELECT id::text FROM payments WHERE school_id=$1 AND idempotency_key=$2`, c.GetString("school"), key).Scan(&existing) == nil {
		c.JSON(200, gin.H{"id": existing, "replayed": true})
		return
	}
	var id string
	e = tx.QueryRow(c, `INSERT INTO payments(school_id,student_id,charge_id,amount_cents,received_on,method,observation,idempotency_key) SELECT $1,ch.student_id,ch.id,$3::bigint,$4,nullif($5,''),$6,$7 FROM charges ch WHERE ch.id=$2 AND ch.school_id=$1 AND ch.status='active' AND $3::bigint <= ch.total_cents-coalesce((SELECT sum(p.amount_cents) FROM payments p WHERE p.charge_id=ch.id AND p.status='valid'),0) RETURNING id::text`, c.GetString("school"), in.ChargeID, amount, in.Date, method, in.Observation, key).Scan(&id)
	if e == nil {
		_, e = tx.Exec(c, `INSERT INTO payment_history(school_id,payment_id,action,new_data) VALUES($1,$2,'created',jsonb_build_object('amountCents',$3::bigint))`, c.GetString("school"), id, amount)
	}
	if e != nil {
		fail(c, 400, "No se pudo registrar el pago")
		return
	}
	if e = tx.Commit(c); e != nil {
		fail(c, 500, "No se pudo guardar el pago")
		return
	}
	c.JSON(201, gin.H{"id": id})
}

func (s *Server) correctPayment(c *gin.Context) {
	var in struct {
		ChargeID    string `json:"chargeId"`
		Amount      string `json:"amount"`
		Date        string `json:"date"`
		Method      string `json:"method"`
		Observation string `json:"observation"`
		Reason      string `json:"reason"`
		Version     int    `json:"version"`
	}
	if c.ShouldBindJSON(&in) != nil || strings.TrimSpace(in.Reason) == "" || in.Version < 1 {
		fail(c, 400, "Indica los datos y el motivo de la corrección")
		return
	}
	amount, e := pagos.ParseMoney(in.Amount)
	if e != nil || amount <= 0 {
		fail(c, 400, "Importe inválido")
		return
	}
	method := map[string]string{"Efectivo": "cash", "Transferencia": "transfer", "Tarjeta": "card", "Otro": "other", "": ""}[in.Method]
	tx, e := s.DB.Begin(c)
	if e != nil {
		fail(c, 500, "No se pudo corregir")
		return
	}
	defer tx.Rollback(c)
	var oldCharge, oldDate, oldMethod, oldObservation string
	var oldAmount int64
	var student string
	e = tx.QueryRow(c, `SELECT charge_id::text,amount_cents,received_on::text,coalesce(method,''),coalesce(observation,''),student_id::text FROM payments WHERE id=$1 AND school_id=$2 AND version=$3 AND status='valid' FOR UPDATE`, c.Param("id"), c.GetString("school"), in.Version).Scan(&oldCharge, &oldAmount, &oldDate, &oldMethod, &oldObservation, &student)
	if e != nil {
		fail(c, 409, errConflict.Error())
		return
	}
	var targetStudent string
	var available int64
	e = tx.QueryRow(c, `SELECT ch.student_id::text,ch.total_cents-coalesce((SELECT sum(p.amount_cents) FROM payments p WHERE p.charge_id=ch.id AND p.status='valid' AND p.id<>$3),0) FROM charges ch WHERE ch.id=$1 AND ch.school_id=$2 AND ch.status='active'`, in.ChargeID, c.GetString("school"), c.Param("id")).Scan(&targetStudent, &available)
	if e != nil || targetStudent != student || amount > available {
		fail(c, 400, "El concepto no corresponde al alumno o el importe supera el saldo")
		return
	}
	_, e = tx.Exec(c, `UPDATE payments SET charge_id=$1,amount_cents=$2,received_on=$3,method=nullif($4,''),observation=$5,version=version+1,updated_at=now() WHERE id=$6 AND school_id=$7`, in.ChargeID, amount, in.Date, method, in.Observation, c.Param("id"), c.GetString("school"))
	if e == nil {
		_, e = tx.Exec(c, `INSERT INTO payment_history(school_id,payment_id,action,previous_data,new_data,reason) VALUES($1,$2,'corrected',jsonb_build_object('chargeId',$3::text,'amountCents',$4::bigint,'date',$5::text,'method',$6::text,'observation',$7::text),jsonb_build_object('chargeId',$8::text,'amountCents',$9::bigint,'date',$10::text,'method',$11::text,'observation',$12::text),$13)`, c.GetString("school"), c.Param("id"), oldCharge, oldAmount, oldDate, oldMethod, oldObservation, in.ChargeID, amount, in.Date, method, in.Observation, in.Reason)
	}
	if e != nil {
		fail(c, 500, "No se pudo conservar el historial")
		return
	}
	if e = tx.Commit(c); e != nil {
		fail(c, 500, "No se pudo guardar")
		return
	}
	c.Status(204)
}
func (s *Server) voidPayment(c *gin.Context) {
	var in struct {
		Reason  string `json:"reason"`
		Version int    `json:"version"`
	}
	if c.ShouldBindJSON(&in) != nil || strings.TrimSpace(in.Reason) == "" {
		fail(c, 400, "Indica el motivo")
		return
	}
	tx, e := s.DB.Begin(c)
	if e != nil {
		fail(c, 500, "No se pudo anular")
		return
	}
	defer tx.Rollback(c)
	tag, e := tx.Exec(c, `UPDATE payments SET status='void',version=version+1,updated_at=now() WHERE id=$1 AND school_id=$2 AND version=$3 AND status='valid'`, c.Param("id"), c.GetString("school"), in.Version)
	if e != nil || tag.RowsAffected() == 0 {
		fail(c, 409, "El pago cambió; recarga")
		return
	}
	_, e = tx.Exec(c, `INSERT INTO payment_history(school_id,payment_id,action,reason,new_data) VALUES($1,$2,'voided',$3,'{"status":"void"}')`, c.GetString("school"), c.Param("id"), in.Reason)
	if e != nil {
		fail(c, 500, "No se pudo guardar el historial")
		return
	}
	if e = tx.Commit(c); e != nil {
		fail(c, 500, "No se pudo guardar la anulación")
		return
	}
	c.Status(204)
}
func (s *Server) createDiscount(c *gin.Context) {
	var in struct {
		StudentID string `json:"studentId"`
		Kind      string `json:"kind"`
		Reason    string `json:"reason"`
		Period    string `json:"period"`
		Value     int64  `json:"value"`
		Recurring bool   `json:"recurring"`
	}
	if c.ShouldBindJSON(&in) != nil || pagos.ValidateDiscount(in.Kind, in.Value, in.Reason, in.Period, in.Recurring) != nil {
		fail(c, 400, "Descuento inválido")
		return
	}
	_, e := s.DB.Exec(c, `INSERT INTO discounts(school_id,student_id,kind,value,reason,period,recurring) SELECT $1,s.id,$3,$4,$5,$6,$7 FROM students s WHERE s.id=$2 AND s.school_id=$1`, c.GetString("school"), in.StudentID, in.Kind, in.Value, in.Reason, in.Period, in.Recurring)
	if e != nil {
		fail(c, 400, "No se pudo guardar el descuento")
		return
	}
	c.Status(201)
}

type orderItemIn struct {
	Name     string `json:"name"`
	Size     string `json:"size"`
	Price    string `json:"price"`
	Quantity int    `json:"quantity"`
}

func (s *Server) createOrder(c *gin.Context) {
	var in struct {
		StudentID string        `json:"studentId"`
		DueDate   string        `json:"dueDate"`
		Items     []orderItemIn `json:"items"`
	}
	if c.ShouldBindJSON(&in) != nil || len(in.Items) == 0 {
		fail(c, 400, "Agrega al menos un artículo")
		return
	}
	tx, e := s.DB.Begin(c)
	if e != nil {
		fail(c, 500, "No se pudo crear")
		return
	}
	defer tx.Rollback(c)
	key := idem(c)
	if existing, replayed, err := reserveIdempotency(c, tx, c.GetString("school"), key, "createOrder"); err != nil {
		fail(c, http.StatusConflict, err.Error())
		return
	} else if replayed {
		c.JSON(http.StatusOK, gin.H{"id": existing, "replayed": true})
		return
	}
	// El código sigue al mayor existente; el bloqueo de la escuela evita códigos repetidos.
	if _, e = tx.Exec(c, `SELECT 1 FROM schools WHERE id=$1 FOR UPDATE`, c.GetString("school")); e != nil {
		fail(c, 500, "No se pudo crear")
		return
	}
	var oid, code string
	e = tx.QueryRow(c, `INSERT INTO orders(school_id,student_id,code,payment_due_date) SELECT $1,s.id,'P-'||(coalesce((SELECT max(substring(o.code from 3)::int) FROM orders o WHERE o.school_id=$1 AND o.code ~ '^P-[0-9]+$'),100)+1),$3 FROM students s WHERE s.id=$2 AND s.school_id=$1 RETURNING id::text,code`, c.GetString("school"), in.StudentID, in.DueDate).Scan(&oid, &code)
	if e != nil {
		fail(c, 400, "Alumno o fecha inválidos")
		return
	}
	for i, it := range in.Items {
		price, pe := pagos.ParseMoney(it.Price)
		if pe != nil || it.Quantity < 1 {
			fail(c, 400, "Artículo inválido")
			return
		}
		var iid string
		e = tx.QueryRow(c, `INSERT INTO order_items(school_id,order_id,name,size,quantity,unit_price_cents) VALUES($1,$2,$3,$4,$5,$6) RETURNING id::text`, c.GetString("school"), oid, it.Name, it.Size, it.Quantity, price).Scan(&iid)
		if e == nil {
			_, e = tx.Exec(c, `INSERT INTO charges(school_id,student_id,kind,reference_id,reference_item_id,period,description,original_cents,total_cents,due_date,idempotency_key) VALUES($1,$2,'order',$3,$4,to_char($5::date,'YYYY-MM'),$6,$7,$7,$5,$8)`, c.GetString("school"), in.StudentID, oid, iid, in.DueDate, "Pedido "+code+" · "+it.Name, price*int64(it.Quantity), fmt.Sprintf("order:%s:%d", oid, i))
		}
		if e != nil {
			fail(c, 400, "No se pudo crear el artículo")
			return
		}
	}
	if e = completeIdempotency(c, tx, c.GetString("school"), key, "createOrder", oid); e != nil {
		fail(c, 500, "No se pudo confirmar el pedido")
		return
	}
	if e = tx.Commit(c); e != nil {
		fail(c, 500, "No se pudo guardar el pedido")
		return
	}
	c.JSON(201, gin.H{"id": oid, "code": code})
}

func (s *Server) updateOrderProgressBulk(c *gin.Context) {
	var in struct {
		Mode  string `json:"mode"`
		Items []struct {
			ID      string `json:"id"`
			Version int    `json:"version"`
		} `json:"items"`
	}
	if c.ShouldBindJSON(&in) != nil || len(in.Items) == 0 || (in.Mode != "receivePending" && in.Mode != "deliverReceived") {
		fail(c, http.StatusBadRequest, "Modo y artículos activos son obligatorios")
		return
	}
	expected := make(map[string]int, len(in.Items))
	for _, item := range in.Items {
		if item.ID == "" || item.Version < 1 {
			fail(c, http.StatusBadRequest, "La lista de artículos es inválida")
			return
		}
		if _, duplicate := expected[item.ID]; duplicate {
			fail(c, http.StatusBadRequest, "La lista contiene artículos repetidos")
			return
		}
		expected[item.ID] = item.Version
	}

	tx, e := s.DB.Begin(c)
	if e != nil {
		fail(c, http.StatusInternalServerError, "No se pudo iniciar la operación")
		return
	}
	defer tx.Rollback(c)
	var orderID string
	if e = tx.QueryRow(c, `SELECT id::text FROM orders WHERE id=$1 AND school_id=$2 FOR UPDATE`, c.Param("id"), c.GetString("school")).Scan(&orderID); e != nil {
		fail(c, http.StatusNotFound, "Pedido no encontrado")
		return
	}
	key := idem(c)
	if existing, replayed, err := reserveIdempotency(c, tx, c.GetString("school"), key, "updateOrderProgressBulk"); err != nil {
		fail(c, http.StatusConflict, err.Error())
		return
	} else if replayed {
		if existing != orderID {
			fail(c, http.StatusConflict, "La clave de idempotencia pertenece a otro pedido")
			return
		}
		c.Status(http.StatusNoContent)
		return
	}

	type lockedItem struct {
		id                            string
		quantity, received, delivered int
		version                       int
	}
	rows, e := tx.Query(c, `SELECT id::text,quantity,received_quantity,delivered_quantity,version FROM order_items WHERE order_id=$1 AND school_id=$2 AND NOT cancelled ORDER BY id FOR UPDATE`, orderID, c.GetString("school"))
	if e != nil {
		fail(c, http.StatusInternalServerError, "No se pudieron bloquear los artículos")
		return
	}
	items := make([]lockedItem, 0, len(in.Items))
	for rows.Next() {
		var item lockedItem
		if e = rows.Scan(&item.id, &item.quantity, &item.received, &item.delivered, &item.version); e != nil {
			rows.Close()
			fail(c, http.StatusInternalServerError, "No se pudieron consultar los artículos")
			return
		}
		items = append(items, item)
	}
	if e = rows.Err(); e != nil {
		rows.Close()
		fail(c, http.StatusInternalServerError, "No se pudieron consultar los artículos")
		return
	}
	rows.Close()
	versions := make([]pagos.VersionedItem, 0, len(items))
	for _, item := range items {
		versions = append(versions, pagos.VersionedItem{ID: item.id, Version: item.version})
	}
	if validationErr := pagos.ValidateBulkItemVersions(expected, versions); validationErr != nil {
		fail(c, http.StatusConflict, validationErr.Error()+"; no se actualizó el pedido")
		return
	}
	for _, item := range items {
		received, delivered, ruleErr := pagos.NextOrderProgress(in.Mode, item.quantity, item.received, item.delivered)
		if ruleErr != nil {
			fail(c, http.StatusBadRequest, ruleErr.Error())
			return
		}
		tag, updateErr := tx.Exec(c, `UPDATE order_items SET received_quantity=$1,delivered_quantity=$2,version=version+1 WHERE id=$3 AND school_id=$4 AND order_id=$5 AND version=$6`, received, delivered, item.id, c.GetString("school"), orderID, item.version)
		if updateErr != nil || tag.RowsAffected() != 1 {
			fail(c, http.StatusConflict, "Un artículo cambió; no se actualizó el pedido")
			return
		}
	}
	if e = completeIdempotency(c, tx, c.GetString("school"), key, "updateOrderProgressBulk", orderID); e != nil {
		fail(c, http.StatusConflict, e.Error())
		return
	}
	if e = tx.Commit(c); e != nil {
		fail(c, http.StatusInternalServerError, "No se pudo confirmar el avance del pedido")
		return
	}
	c.Status(http.StatusNoContent)
}

func (s *Server) updateOrderItem(c *gin.Context) {
	var in struct {
		Requested bool   `json:"requested"`
		Received  int    `json:"received"`
		Delivered int    `json:"delivered"`
		Version   int    `json:"version"`
		Cancelled bool   `json:"cancelled"`
		Reason    string `json:"reason"`
	}
	if c.ShouldBindJSON(&in) != nil {
		fail(c, 400, "Cantidades inválidas")
		return
	}
	tx, e := s.DB.Begin(c)
	if e != nil {
		fail(c, 500, "No se pudo actualizar")
		return
	}
	defer tx.Rollback(c)
	var quantity int
	var alreadyCancelled bool
	if e = tx.QueryRow(c, `SELECT quantity,cancelled FROM order_items WHERE id=$1 AND school_id=$2 FOR UPDATE`, c.Param("id"), c.GetString("school")).Scan(&quantity, &alreadyCancelled); e != nil {
		fail(c, 404, "Artículo no encontrado")
		return
	}
	if alreadyCancelled {
		fail(c, 409, "El artículo cancelado no admite operaciones")
		return
	}
	if e = pagos.ValidateOrderProgress(quantity, in.Received, in.Delivered); e != nil {
		fail(c, 400, e.Error())
		return
	}
	if in.Cancelled {
		var paid bool
		e = tx.QueryRow(c, `SELECT EXISTS(SELECT 1 FROM payments p JOIN charges ch ON ch.id=p.charge_id WHERE ch.reference_item_id=$1 AND ch.school_id=$2 AND p.status='valid')`, c.Param("id"), c.GetString("school")).Scan(&paid)
		if e != nil || paid {
			fail(c, 409, "Anula primero los pagos vigentes del artículo")
			return
		}
	}
	tag, e := tx.Exec(c, `UPDATE order_items SET requested_to_supplier=$1,received_quantity=$2,delivered_quantity=$3,cancelled=$4,cancel_reason=$5,version=version+1 WHERE id=$6 AND school_id=$7 AND version=$8 AND $2<=quantity AND $3<=$2`, in.Requested, in.Received, in.Delivered, in.Cancelled, in.Reason, c.Param("id"), c.GetString("school"), in.Version)
	if e != nil || tag.RowsAffected() == 0 {
		fail(c, 409, "Cantidades inválidas o registro desactualizado")
		return
	}
	if in.Cancelled {
		_, e = tx.Exec(c, `UPDATE charges SET status='cancelled',cancellation_reason=$1 WHERE school_id=$2 AND reference_item_id=$3`, in.Reason, c.GetString("school"), c.Param("id"))
	}
	if e != nil {
		fail(c, 500, "No se pudo actualizar el cobro")
		return
	}
	if e = tx.Commit(c); e != nil {
		fail(c, 500, "No se pudo guardar")
		return
	}
	c.Status(http.StatusNoContent)
}
