.PHONY: verify frontend backend compose

verify: frontend backend compose

frontend:
	cd frontend && npm run verify

backend:
	cd backend && GOCACHE="$${GOCACHE:-/tmp/tkd-go-cache}" GOMODCACHE="$${GOMODCACHE:-/tmp/tkd-go-mod}" go test ./...
	cd backend && GOCACHE="$${GOCACHE:-/tmp/tkd-go-cache}" GOMODCACHE="$${GOMODCACHE:-/tmp/tkd-go-mod}" go vet ./...

compose:
	docker compose config --quiet
