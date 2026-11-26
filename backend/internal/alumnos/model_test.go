package alumnos

import (
	"testing"
	"time"
)

func TestValidateStudentAllowsOneSurnameAndOptionalHealth(t *testing.T) {
	in := StudentInput{FirstNames: "Luz", LastNames: "Paz", BirthDate: "2014-01-01", GradeID: "grade", PrimaryName: "Mar", PrimaryRelation: "Madre", PrimaryPhone: "1", EmergencyName: "Pedro", EmergencyRelation: "Padre", EmergencyPhone: "2", EnrollmentDate: "2026-10-01", BillingDay: 31, HealthConsent: true}
	if err := ValidateStudent(in, time.Date(2026, 10, 4, 0, 0, 0, 0, time.UTC)); err != nil {
		t.Fatal(err)
	}
}

func TestValidateStudentRejectsFutureEnrollment(t *testing.T) {
	today := time.Date(2026, 10, 3, 0, 0, 0, 0, time.UTC)
	in := StudentInput{FirstNames: "Ana", LastNames: "López", BirthDate: "2012-01-02", GradeID: "grade", PrimaryName: "Patricia", PrimaryRelation: "Madre", PrimaryPhone: "1", EmergencyName: "Luis", EmergencyRelation: "Padre", EmergencyPhone: "2", EnrollmentDate: "2026-10-04", BillingDay: 31, HealthConsent: true}
	if err := ValidateStudent(in, today); err == nil {
		t.Fatal("se esperaba error para inscripción futura")
	}
}

func TestEmergencyContactIsOptionalButDistinct(t *testing.T) {
	base := StudentInput{FirstNames: "Ana", LastNames: "López", BirthDate: "2012-01-02", GradeID: "grade", PrimaryName: "Patricia", PrimaryRelation: "Madre", PrimaryPhone: "1", EnrollmentDate: "2026-10-04", BillingDay: 15, HealthConsent: true}
	today := time.Date(2026, 10, 5, 0, 0, 0, 0, time.UTC)
	if err := ValidateStudent(base, today); err != nil {
		t.Fatalf("sin contacto de emergencia debe ser válido: %v", err)
	}
	partial := base
	partial.EmergencyName = "Luis"
	if ValidateStudent(partial, today) == nil {
		t.Fatal("un contacto de emergencia incompleto debe rechazarse")
	}
	same := base
	same.EmergencyName, same.EmergencyRelation, same.EmergencyPhone = "Patricia", "Madre", "1"
	if ValidateStudent(same, today) == nil {
		t.Fatal("el contacto de emergencia no puede repetir el teléfono del principal")
	}
}

func TestConsentIsRequiredAndPhoneIsOptional(t *testing.T) {
	today := time.Date(2026, 10, 5, 0, 0, 0, 0, time.UTC)
	in := StudentInput{FirstNames: "Ana", LastNames: "López", BirthDate: "2012-01-02", GradeID: "grade", PrimaryName: "Patricia", PrimaryRelation: "Madre", PrimaryPhone: "1", EnrollmentDate: "2026-10-04", BillingDay: 15}
	if ValidateStudent(in, today) == nil {
		t.Fatal("sin autorización no se puede registrar al alumno")
	}
	in.HealthConsent = true
	if err := ValidateStudent(in, today); err != nil {
		t.Fatalf("sin teléfono propio debe ser válido: %v", err)
	}
	in.Phone = "123"
	if ValidateStudent(in, today) == nil {
		t.Fatal("un teléfono propio incompleto debe rechazarse")
	}
	in.Phone = "9991234567"
	if err := ValidateStudent(in, today); err != nil {
		t.Fatalf("teléfono de 10 dígitos válido: %v", err)
	}
}
