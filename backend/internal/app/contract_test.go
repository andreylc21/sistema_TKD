package app

import (
	"os"
	"regexp"
	"strings"
	"testing"
)

func TestOpenAPIListsEveryBusinessRoute(t *testing.T) {
	body, err := os.ReadFile("../../../docs/openapi.yaml")
	if err != nil {
		t.Fatal(err)
	}
	contract := string(body)
	paths := []string{"/auth/login:", "/auth/me:", "/auth/logout:", "/bootstrap:", "/demo/reset:", "/students:", "/students/{id}:", "/students/{id}/status:", "/students/{id}/notes:", "/notes/{id}:", "/groups:", "/groups/{id}:", "/groups/{id}/assignments:", "/sessions:", "/sessions/{id}/participants:", "/sessions/{id}/attendance/{student}:", "/sessions/{id}/status:", "/payments:", "/payments/{id}:", "/payments/{id}/void:", "/discounts:", "/orders:", "/orders/{id}/progress:", "/order-items/{id}:"}
	for _, path := range paths {
		if !strings.Contains(contract, path) {
			t.Errorf("falta ruta en OpenAPI: %s", path)
		}
	}
}

func TestOpenAPIListsEveryOperation(t *testing.T) {
	body, err := os.ReadFile("../../../docs/openapi.yaml")
	if err != nil {
		t.Fatal(err)
	}
	contract := string(body)
	operations := []string{
		"login", "currentSession", "logout", "bootstrap", "resetDemo",
		"createStudent", "updateStudent", "changeStudentStatus", "createNote", "updateNote", "deleteNote",
		"createGroup", "updateGroup", "assignStudent", "createSession", "inviteParticipant", "updateAttendance", "updateSessionStatus",
		"createPayment", "correctPayment", "voidPayment", "createDiscount", "createOrder", "updateOrderProgress", "updateOrderProgressBulk",
	}
	for _, operation := range operations {
		pattern := regexp.MustCompile(`operationId:\s+` + regexp.QuoteMeta(operation) + `\b`)
		if count := len(pattern.FindAllStringIndex(contract, -1)); count != 1 {
			t.Errorf("operationId %s aparece %d veces; se esperaba exactamente una", operation, count)
		}
	}
}
