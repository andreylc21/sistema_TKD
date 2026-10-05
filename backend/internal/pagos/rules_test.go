package pagos

import (
	"testing"
	"time"
)

func TestDueDatePreservesBillingDayAcrossShortMonth(t *testing.T) {
	if got := DueDate(2027, time.February, 31).Format("2006-01-02"); got != "2027-02-28" {
		t.Fatal(got)
	}
	if got := DueDate(2027, time.March, 31).Format("2006-01-02"); got != "2027-03-31" {
		t.Fatal(got)
	}
}
func TestDiscount(t *testing.T) {
	if discount := DiscountCents(60000, "percentage", 2500); 60000-discount != 45000 {
		t.Fatalf("total calculado %d", 60000-discount)
	}
	if got := DiscountCents(85000, "fixed", 90000); got != 85000 {
		t.Fatal(got)
	}
}
func TestMoney(t *testing.T) {
	got, err := ParseMoney("1,200.50")
	if err != nil || got != 120050 {
		t.Fatalf("%d %v", got, err)
	}
}

func TestCyclesSkipInactiveGap(t *testing.T) {
	from := time.Date(2026, 1, 31, 0, 0, 0, 0, time.UTC)
	to := time.Date(2026, 2, 28, 0, 0, 0, 0, time.UTC)
	got := CycleDueDates(from, &to, time.Date(2026, 3, 31, 0, 0, 0, 0, time.UTC), 31)
	if len(got) != 2 || got[0].Day() != 31 || got[1].Day() != 28 {
		t.Fatalf("%v", got)
	}
}

func TestValidateOrderProgress(t *testing.T) {
	if err := ValidateOrderProgress(3, 2, 1); err != nil {
		t.Fatalf("avance válido rechazado: %v", err)
	}
	for _, values := range [][3]int{{3, 1, 2}, {3, 4, 1}, {3, -1, 0}} {
		if err := ValidateOrderProgress(values[0], values[1], values[2]); err == nil {
			t.Fatalf("se esperaba error para %v", values)
		}
	}
}

func TestNextOrderProgressKeepsDimensionsIndependent(t *testing.T) {
	received, delivered, err := NextOrderProgress("deliverReceived", 3, 2, 1)
	if err != nil || received != 2 || delivered != 2 {
		t.Fatalf("entrega calculada como recibido=%d entregado=%d error=%v", received, delivered, err)
	}
	received, delivered, err = NextOrderProgress("receivePending", 3, 1, 1)
	if err != nil || received != 3 || delivered != 1 {
		t.Fatalf("recepción calculada como recibido=%d entregado=%d error=%v", received, delivered, err)
	}
	if _, _, err = NextOrderProgress("unknown", 3, 1, 0); err == nil {
		t.Fatal("se esperaba error para un modo desconocido")
	}
}

func TestValidateBulkItemVersionsRejectsBeforeUpdates(t *testing.T) {
	actual := []VersionedItem{{ID: "a", Version: 2}, {ID: "b", Version: 4}}
	if err := ValidateBulkItemVersions(map[string]int{"a": 2, "b": 4}, actual); err != nil {
		t.Fatalf("lista vigente rechazada: %v", err)
	}
	if err := ValidateBulkItemVersions(map[string]int{"a": 1, "b": 4}, actual); err == nil {
		t.Fatal("se esperaba rechazo por versión desactualizada")
	}
	if err := ValidateBulkItemVersions(map[string]int{"a": 2}, actual); err == nil {
		t.Fatal("se esperaba rechazo por lista incompleta")
	}
}

func TestValidateDiscount(t *testing.T) {
	if err := ValidateDiscount("percentage", 2500, "Beca", "", true); err != nil {
		t.Fatalf("descuento válido rechazado: %v", err)
	}
	if err := ValidateDiscount("percentage", 11000, "Beca", "", true); err == nil {
		t.Fatal("se esperaba error para porcentaje mayor a 100")
	}
	if err := ValidateDiscount("fixed", 10000, "", "2026-10", false); err == nil {
		t.Fatal("se esperaba error para motivo vacío")
	}
}
