// Package examenes concentra las reglas de avance hacia la cinta negra.
package examenes

import "fmt"

// PoomMaxAge es la edad a partir de la cual el grado de cinta negra es dan y no poom.
const PoomMaxAge = 15

// RequiredPartials devuelve los parciales que hacen falta para llegar al grado negro `target`
// (1 = primer poom/dan). El primero pide 5; desde el segundo son 2N+3.
func RequiredPartials(target int) int {
	if target <= 1 {
		return 5
	}
	return 2*target + 3
}

// MinMonths es el tiempo orientativo desde el último examen final. Para el primer grado negro
// no hay mínimo: bastan los parciales (cinco por año).
func MinMonths(target int) int {
	if target <= 1 {
		return 0
	}
	return target * 12
}

// BlackTrack devuelve "poom" para menores de 15 años y "dan" para el resto.
func BlackTrack(age int) string {
	if age < PoomMaxAge {
		return "poom"
	}
	return "dan"
}

// Progress es el avance de un alumno hacia el siguiente examen final.
type Progress struct {
	Target   int      `json:"target"`
	Track    string   `json:"track"`
	Partials int      `json:"partials"`
	Required int      `json:"required"`
	Months   *int     `json:"months"`
	MinMonth int      `json:"minMonths"`
	Ready    bool     `json:"ready"`
	Missing  []string `json:"missing"`
}

// Evaluate calcula si el alumno cumple los requisitos orientativos. monthsSince es nil cuando no
// se conoce el último examen final; en ese caso el tiempo no se exige.
func Evaluate(target, age, partials int, monthsSince *int) Progress {
	p := Progress{
		Target:   target,
		Track:    BlackTrack(age),
		Partials: partials,
		Required: RequiredPartials(target),
		Months:   monthsSince,
		MinMonth: MinMonths(target),
		Missing:  []string{},
	}
	if partials < p.Required {
		p.Missing = append(p.Missing, fmt.Sprintf("faltan %d parciales", p.Required-partials))
	}
	if monthsSince != nil && *monthsSince < p.MinMonth {
		p.Missing = append(p.Missing, fmt.Sprintf("faltan %d meses", p.MinMonth-*monthsSince))
	}
	p.Ready = len(p.Missing) == 0
	return p
}

// DefaultLeadDays es la anticipación con que debe pagarse un examen: un mes el final de cinta
// negra y dos semanas un parcial.
func DefaultLeadDays(kind string) int {
	if kind == "black" {
		return 30
	}
	return 14
}
