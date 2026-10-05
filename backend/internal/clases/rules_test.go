package clases

import "testing"

func TestValidateGroup(t *testing.T) {
	if err := ValidateGroup("Infantil", []string{"Lunes", "Miércoles"}, "17:00", "18:00"); err != nil {
		t.Fatalf("grupo válido rechazado: %v", err)
	}
	if err := ValidateGroup("Infantil", []string{"Lunes"}, "18:00", "17:00"); err == nil {
		t.Fatal("se esperaba error para horario invertido")
	}
	if err := ValidateGroup("Infantil", []string{"Domingo"}, "17:00", "18:00"); err == nil {
		t.Fatal("se esperaba error para día no permitido")
	}
}
