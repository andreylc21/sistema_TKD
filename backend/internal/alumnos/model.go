package alumnos

import (
	"fmt"
	"strings"
	"time"
)

type StudentInput struct {
	FirstNames        string `json:"firstNames"`
	LastNames         string `json:"lastNames"`
	BirthDate         string `json:"birthDate"`
	GradeID           string `json:"gradeId"`
	Email             string `json:"email"`
	EmailOwner        string `json:"emailOwner"`
	PrimaryName       string `json:"primaryName"`
	PrimaryRelation   string `json:"primaryRelation"`
	PrimaryPhone      string `json:"primaryPhone"`
	EmergencyName     string `json:"emergencyName"`
	EmergencyRelation string `json:"emergencyRelation"`
	EmergencyPhone    string `json:"emergencyPhone"`
	Restrictions      string `json:"restrictions"`
	HealthConsent     bool   `json:"healthConsent"`
	EnrollmentDate    string `json:"enrollmentDate"`
	BillingDay        int    `json:"billingDay"`
	Version           int    `json:"version"`
}

func ValidateStudent(in StudentInput, today time.Time) error {
	if strings.TrimSpace(in.FirstNames) == "" || strings.TrimSpace(in.LastNames) == "" || in.BirthDate == "" || in.EnrollmentDate == "" || in.GradeID == "" || in.PrimaryName == "" || in.PrimaryRelation == "" || in.PrimaryPhone == "" || in.EmergencyName == "" || in.EmergencyRelation == "" || in.EmergencyPhone == "" || in.BillingDay < 1 || in.BillingDay > 31 {
		return fmt.Errorf("completa los campos obligatorios")
	}
	birth, err := time.Parse("2006-01-02", in.BirthDate)
	if err != nil || birth.After(today) {
		return fmt.Errorf("fecha de nacimiento inválida")
	}
	enrollment, err := time.Parse("2006-01-02", in.EnrollmentDate)
	if err != nil || enrollment.After(today) || enrollment.Before(birth) {
		return fmt.Errorf("fecha de inscripción inválida")
	}
	if in.EmailOwner != "" && in.EmailOwner != "alumno" && in.EmailOwner != "responsable" {
		return fmt.Errorf("propietario del correo inválido")
	}
	return nil
}
