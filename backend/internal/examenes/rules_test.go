package examenes

import "testing"

func TestRequiredPartials(t *testing.T) {
	for target, want := range map[int]int{1: 5, 2: 7, 3: 9, 4: 11, 5: 13} {
		if got := RequiredPartials(target); got != want {
			t.Errorf("RequiredPartials(%d) = %d, quiero %d", target, got, want)
		}
	}
}

func TestMinMonths(t *testing.T) {
	for target, want := range map[int]int{1: 0, 2: 24, 3: 36} {
		if got := MinMonths(target); got != want {
			t.Errorf("MinMonths(%d) = %d, quiero %d", target, got, want)
		}
	}
}

func TestBlackTrackSplitsAtFifteen(t *testing.T) {
	if BlackTrack(14) != "poom" || BlackTrack(15) != "dan" {
		t.Fatal("poom debe ser para menores de 15 y dan desde los 15")
	}
}

func TestEvaluate(t *testing.T) {
	months := func(n int) *int { return &n }
	if p := Evaluate(1, 20, 5, nil); !p.Ready {
		t.Errorf("1er dan con 5 parciales y sin fecha previa debe estar listo: %+v", p)
	}
	if p := Evaluate(1, 20, 4, nil); p.Ready || len(p.Missing) != 1 {
		t.Errorf("con 4 parciales falta uno: %+v", p)
	}
	if p := Evaluate(2, 20, 7, months(10)); p.Ready || len(p.Missing) != 1 {
		t.Errorf("2º dan con 7 parciales pero 10 meses no está listo: %+v", p)
	}
	if p := Evaluate(2, 20, 7, months(24)); !p.Ready {
		t.Errorf("2º dan con 7 parciales y 24 meses está listo: %+v", p)
	}
	if p := Evaluate(3, 12, 2, months(5)); p.Ready || len(p.Missing) != 2 || p.Track != "poom" {
		t.Errorf("menor de 15 sin requisitos: %+v", p)
	}
}

func TestDefaultLeadDays(t *testing.T) {
	if DefaultLeadDays("black") != 7 || DefaultLeadDays("partial") != 7 {
		t.Fatal("el final se paga un mes antes y el parcial dos semanas antes")
	}
}
