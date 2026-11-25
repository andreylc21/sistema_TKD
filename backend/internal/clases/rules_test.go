package clases

import "testing"

func TestValidateGroupAcceptsSunday(t *testing.T) {
	if err := ValidateGroup("Especial", []string{"Domingo"}, "09:00", "10:00"); err != nil {
		t.Fatalf("el domingo debe ser válido: %v", err)
	}
}

func TestValidateGroup(t *testing.T) {
	if err := ValidateGroup("Infantil", []string{"Lunes", "Miércoles"}, "17:00", "18:00"); err != nil {
		t.Fatalf("grupo válido rechazado: %v", err)
	}
	if err := ValidateGroup("Infantil", []string{"Lunes"}, "18:00", "17:00"); err == nil {
		t.Fatal("se esperaba error para horario invertido")
	}
	if err := ValidateGroup("Infantil", []string{"Festivo"}, "17:00", "18:00"); err == nil {
		t.Fatal("se esperaba error para día no permitido")
	}
}

func TestValidateAgeRange(t *testing.T) {
	n := func(v int) *int { return &v }
	if err := ValidateAgeRange(nil, nil); err != nil {
		t.Errorf("sin perfil debe ser válido: %v", err)
	}
	if err := ValidateAgeRange(n(6), nil); err != nil {
		t.Errorf("sólo mínima debe ser válido: %v", err)
	}
	if err := ValidateAgeRange(n(10), n(9)); err == nil {
		t.Error("mínima mayor que máxima debe fallar")
	}
	if err := ValidateAgeRange(n(-1), nil); err == nil {
		t.Error("edad negativa debe fallar")
	}
}
