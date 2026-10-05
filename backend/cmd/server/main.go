package main

import (
	"context"
	"log"
	"net/http"
	"os/signal"
	"sistema-tkd/backend/internal/app"
	"sistema-tkd/backend/internal/store"
	"syscall"
	"time"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	cfg := store.LoadConfig()
	db, e := store.Open(ctx, cfg)
	if e != nil {
		log.Fatal(e)
	}
	defer db.Close()
	if e = store.Migrate(ctx, db, cfg.MigrationsDir); e != nil {
		log.Fatal(e)
	}
	if cfg.SeedDemo {
		if e = store.Seed(ctx, db, cfg.SeedFile); e != nil {
			log.Fatal(e)
		}
	}
	srv := app.NewServer(db, cfg)
	if e = srv.GenerateMonthlyCharges(ctx, store.DemoNow(cfg)); e != nil {
		log.Printf("monthly charges: %v", e)
	}
	go func() {
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				if err := srv.GenerateMonthlyCharges(ctx, store.DemoNow(cfg)); err != nil {
					log.Printf("monthly charges: %v", err)
				}
			}
		}
	}()
	h := &http.Server{Addr: ":" + cfg.Port, Handler: srv.Router(cfg.FrontendDir), ReadHeaderTimeout: 5 * time.Second}
	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = h.Shutdown(shutdownCtx)
	}()
	log.Printf("Sistema TKD en http://localhost:%s", cfg.Port)
	if e = h.ListenAndServe(); e != nil && e != http.ErrServerClosed {
		log.Fatal(e)
	}
}
