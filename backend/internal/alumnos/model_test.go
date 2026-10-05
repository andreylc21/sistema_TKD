package alumnos

import (
	"testing"
	"time"
)

func TestValidateStudentAllowsOneSurnameAndOptionalHealth(t *testing.T) {
	in := StudentInput{FirstNames: "Luz", LastNames: "Paz", BirthDate: "2014-01-01", GradeID: "grade", PrimaryName: "Mar", PrimaryRelation: "Madre", PrimaryPhone: "1", EmergencyName: "Mar", EmergencyRelation: "Madre", EmergencyPhone: "1", EnrollmentDate: "2026-10-01", BillingDay: 31}
	if err := ValidateStudent(in, time.Date(2026, 10, 4, 0, 0, 0, 0, time.UTC)); err != nil {
		t.Fatal(err)
	}
}

func TestValidateStudentRejectsFutureEnrollment(t *testing.T) {
	today := time.Date(2026, 10, 3, 0, 0, 0, 0, time.UTC)
	in := StudentInput{FirstNames: "Ana", LastNames: "López", BirthDate: "2012-01-02", GradeID: "grade", PrimaryName: "Patricia", PrimaryRelation: "Madre", PrimaryPhone: "1", EmergencyName: "Patricia", EmergencyRelation: "Madre", EmergencyPhone: "1", EnrollmentDate: "2026-10-04", BillingDay: 31}
	if err := ValidateStudent(in, today); err == nil {
		t.Fatal("se esperaba error para inscripción futura")
	}
}
