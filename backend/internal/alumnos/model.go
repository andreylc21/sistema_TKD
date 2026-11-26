package alumnos

import (
	"fmt"
	"regexp"
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
	Phone             string `json:"phone"`
	EnrollmentDate    string `json:"enrollmentDate"`
	BillingDay        int    `json:"billingDay"`
	Version           int    `json:"version"`
}

func ValidateStudent(in StudentInput, today time.Time) error {
	if strings.TrimSpace(in.FirstNames) == "" || strings.TrimSpace(in.LastNames) == "" || in.BirthDate == "" || in.EnrollmentDate == "" || in.GradeID == "" || in.PrimaryName == "" || in.PrimaryRelation == "" || in.PrimaryPhone == "" || in.BillingDay < 1 || in.BillingDay > 31 {
		return fmt.Errorf("completa los campos obligatorios")
	}
	if !in.HealthConsent {
		return fmt.Errorf("falta la autorización para el tratamiento de los datos")
	}
	if phone := strings.TrimSpace(in.Phone); phone != "" && !regexp.MustCompile(`^\d{10}$`).MatchString(phone) {
		return fmt.Errorf("el teléfono del alumno debe tener 10 dígitos")
	}
	emergency := []string{in.EmergencyName, in.EmergencyRelation, in.EmergencyPhone}
	filled := 0
	for _, v := range emergency {
		if strings.TrimSpace(v) != "" {
			filled++
		}
	}
	if filled > 0 && filled < len(emergency) {
		return fmt.Errorf("completa nombre, relación y teléfono del contacto de emergencia")
	}
	if filled > 0 && strings.TrimSpace(in.EmergencyPhone) == strings.TrimSpace(in.PrimaryPhone) {
		return fmt.Errorf("el contacto de emergencia debe ser distinto del principal")
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
