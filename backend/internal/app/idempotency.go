package app

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
)

var (
	errIdempotencyConflict = errors.New("la clave de idempotencia ya pertenece a otra operación")
	errIdempotencyPending  = errors.New("la operación todavía está en proceso")
)

// reserveIdempotency serializa creaciones que no tienen una clave natural.
// Debe ejecutarse dentro de la misma transacción que crea el recurso.
func reserveIdempotency(ctx context.Context, tx pgx.Tx, schoolID, key, operation string) (string, bool, error) {
	tag, err := tx.Exec(ctx, `INSERT INTO request_keys(school_id,idempotency_key,operation) VALUES($1,$2,$3) ON CONFLICT DO NOTHING`, schoolID, key, operation)
	if err != nil {
		return "", false, err
	}
	if tag.RowsAffected() == 1 {
		return "", false, nil
	}

	var existingOperation string
	var resourceID *string
	err = tx.QueryRow(ctx, `SELECT operation,resource_id::text FROM request_keys WHERE school_id=$1 AND idempotency_key=$2 FOR UPDATE`, schoolID, key).Scan(&existingOperation, &resourceID)
	if err != nil {
		return "", false, err
	}
	if existingOperation != operation {
		return "", false, errIdempotencyConflict
	}
	if resourceID == nil {
		return "", false, errIdempotencyPending
	}
	return *resourceID, true, nil
}

func completeIdempotency(ctx context.Context, tx pgx.Tx, schoolID, key, operation, resourceID string) error {
	tag, err := tx.Exec(ctx, `UPDATE request_keys SET resource_id=$1 WHERE school_id=$2 AND idempotency_key=$3 AND operation=$4 AND resource_id IS NULL`, resourceID, schoolID, key, operation)
	if err != nil {
		return err
	}
	if tag.RowsAffected() != 1 {
		return errIdempotencyConflict
	}
	return nil
}
