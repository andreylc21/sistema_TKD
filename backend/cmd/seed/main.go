package main

import (
	"context"
	"log"
	"sistema-tkd/backend/internal/store"
)

func main() {
	ctx := context.Background()
	cfg := store.LoadConfig()
	db, e := store.Open(ctx, cfg)
	if e != nil {
		log.Fatal(e)
	}
	defer db.Close()
	if e = store.Migrate(ctx, db, cfg.MigrationsDir); e != nil {
		log.Fatal(e)
	}
	if e = store.Seed(ctx, db, cfg.SeedFile); e != nil {
		log.Fatal(e)
	}
	log.Print("Datos iniciales listos: maestra@sistematkd.local / SistemaTKD2026!")
}
