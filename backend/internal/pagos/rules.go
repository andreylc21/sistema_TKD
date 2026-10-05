package pagos

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

func DueDate(year int, month time.Month, billingDay int) time.Time {
	last := time.Date(year, month+1, 0, 0, 0, 0, 0, time.UTC).Day()
	if billingDay > last {
		billingDay = last
	}
	return time.Date(year, month, billingDay, 0, 0, 0, 0, time.UTC)
}
func DiscountCents(original int64, kind string, value int64) int64 {
	var d int64
	if kind == "percentage" {
		d = original * value / 10000
	} else {
		d = value
	}
	if d > original {
		return original
	}
	if d < 0 {
		return 0
	}
	return d
}
func ParseMoney(value string) (int64, error) {
	v := strings.TrimSpace(strings.ReplaceAll(value, ",", ""))
	parts := strings.Split(v, ".")
	if len(parts) > 2 || len(parts) == 0 {
		return 0, fmt.Errorf("importe inválido")
	}
	whole, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil || whole < 0 {
		return 0, fmt.Errorf("importe inválido")
	}
	cents := int64(0)
	if len(parts) == 2 {
		if len(parts[1]) > 2 {
			return 0, fmt.Errorf("máximo dos decimales")
		}
		p := parts[1] + strings.Repeat("0", 2-len(parts[1]))
		cents, err = strconv.ParseInt(p, 10, 64)
		if err != nil {
			return 0, fmt.Errorf("importe inválido")
		}
	}
	return whole*100 + cents, nil
}

func CycleDueDates(activeFrom time.Time, activeTo *time.Time, today time.Time, billingDay int) []time.Time {
	end := today
	if activeTo != nil && activeTo.Before(end) {
		end = *activeTo
	}
	if end.Before(activeFrom) {
		return nil
	}
	dates := []time.Time{activeFrom}
	cursor := time.Date(activeFrom.Year(), activeFrom.Month()+1, 1, 0, 0, 0, 0, time.UTC)
	lastMonth := time.Date(end.Year(), end.Month(), 1, 0, 0, 0, 0, time.UTC)
	for !cursor.After(lastMonth) {
		due := DueDate(cursor.Year(), cursor.Month(), billingDay)
		if !due.After(end) {
			dates = append(dates, due)
		}
		cursor = cursor.AddDate(0, 1, 0)
	}
	return dates
}

func ValidateOrderProgress(quantity, received, delivered int) error {
	if quantity < 1 || received < 0 || delivered < 0 || delivered > received || received > quantity {
		return fmt.Errorf("las cantidades deben cumplir entregado <= recibido <= solicitado")
	}
	return nil
}

// NextOrderProgress calcula el avance de una acción global sin mezclar recepción,
// entrega ni el indicador independiente de solicitud al proveedor.
func NextOrderProgress(mode string, quantity, received, delivered int) (int, int, error) {
	if err := ValidateOrderProgress(quantity, received, delivered); err != nil {
		return received, delivered, err
	}
	switch mode {
	case "receivePending":
		received = quantity
	case "deliverReceived":
		delivered = received
	default:
		return received, delivered, fmt.Errorf("modo de avance inválido")
	}
	if err := ValidateOrderProgress(quantity, received, delivered); err != nil {
		return received, delivered, err
	}
	return received, delivered, nil
}

type VersionedItem struct {
	ID      string
	Version int
}

// ValidateBulkItemVersions se ejecuta antes de cualquier UPDATE para que una
// lista incompleta o desactualizada aborte la operación global completa.
func ValidateBulkItemVersions(expected map[string]int, actual []VersionedItem) error {
	if len(expected) == 0 || len(expected) != len(actual) {
		return fmt.Errorf("la lista de artículos cambió")
	}
	for _, item := range actual {
		version, included := expected[item.ID]
		if !included || version != item.Version {
			return fmt.Errorf("un artículo cambió")
		}
	}
	return nil
}

func ValidateDiscount(kind string, value int64, reason, period string, recurring bool) error {
	if kind != "fixed" && kind != "percentage" {
		return fmt.Errorf("tipo de descuento inválido")
	}
	if value <= 0 || strings.TrimSpace(reason) == "" {
		return fmt.Errorf("valor y motivo son obligatorios")
	}
	if kind == "percentage" && value > 10000 {
		return fmt.Errorf("el porcentaje no puede superar 100%%")
	}
	if !recurring {
		if _, err := time.Parse("2006-01", period); err != nil {
			return fmt.Errorf("periodo inválido")
		}
	}
	return nil
}
