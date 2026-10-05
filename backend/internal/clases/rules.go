package clases

import (
	"fmt"
	"strings"
	"time"
)

func AttendanceCode(value string) string {
	return map[string]string{"Presente": "present", "Ausente": "absent", "Falta justificada": "justified", "Sin registrar": "unregistered"}[value]
}

func ValidateGroup(name string, days []string, start, end string) error {
	if strings.TrimSpace(name) == "" || len(days) == 0 {
		return fmt.Errorf("nombre y días son obligatorios")
	}
	allowed := map[string]bool{"Lunes": true, "Martes": true, "Miércoles": true, "Jueves": true, "Viernes": true, "Sábado": true}
	seen := make(map[string]bool, len(days))
	for _, day := range days {
		if !allowed[day] || seen[day] {
			return fmt.Errorf("día inválido o repetido")
		}
		seen[day] = true
	}
	startTime, startErr := time.Parse("15:04", start)
	endTime, endErr := time.Parse("15:04", end)
	if startErr != nil || endErr != nil || !endTime.After(startTime) {
		return fmt.Errorf("el horario final debe ser posterior al inicial")
	}
	return nil
}
