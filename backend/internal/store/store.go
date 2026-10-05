package store

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"
	_ "time/tzdata"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type Config struct {
	Port, DatabaseURL, SessionSecret, Timezone, DemoDate, MigrationsDir, SeedFile, FrontendDir string
	DemoMode, SeedDemo, SecureCookies                                                          bool
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
func boolEnv(key string, fallback bool) bool {
	v, err := strconv.ParseBool(os.Getenv(key))
	if err != nil {
		return fallback
	}
	return v
}

func LoadConfig() Config {
	return Config{
		Port: env("PORT", "8080"), DatabaseURL: env("DATABASE_URL", "postgres://tkd:tkd_demo@localhost:5432/tkd?sslmode=disable"),
		SessionSecret: env("SESSION_SECRET", "local-demo-secret-change-this-value"), Timezone: env("SCHOOL_TIMEZONE", "America/Tijuana"),
		DemoDate: env("DEMO_DATE", "2026-10-03"), DemoMode: boolEnv("DEMO_MODE", true), SeedDemo: boolEnv("SEED_DEMO", true),
		SecureCookies: boolEnv("SECURE_COOKIES", false), MigrationsDir: env("MIGRATIONS_DIR", "backend/migrations"), SeedFile: env("SEED_FILE", "backend/seed/001_demo.sql"),
		FrontendDir: env("FRONTEND_DIR", "frontend/dist"),
	}
}

func Open(ctx context.Context, cfg Config) (*pgxpool.Pool, error) {
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		return nil, err
	}
	if err = pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}
	return pool, nil
}

func Migrate(ctx context.Context, pool *pgxpool.Pool, dir string) error {
	if _, err := pool.Exec(ctx, `CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`); err != nil {
		return err
	}
	entries, err := os.ReadDir(dir)
	if err != nil {
		return err
	}
	var names []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".sql") {
			names = append(names, e.Name())
		}
	}
	sort.Strings(names)
	for _, name := range names {
		var exists bool
		if err := pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE name=$1)`, name).Scan(&exists); err != nil {
			return err
		}
		if exists {
			continue
		}
		body, err := os.ReadFile(filepath.Join(dir, name))
		if err != nil {
			return err
		}
		tx, err := pool.Begin(ctx)
		if err != nil {
			return err
		}
		if _, err = tx.Exec(ctx, string(body)); err == nil {
			_, err = tx.Exec(ctx, `INSERT INTO schema_migrations(name) VALUES($1)`, name)
		}
		if err != nil {
			_ = tx.Rollback(ctx)
			return fmt.Errorf("migration %s: %w", name, err)
		}
		if err = tx.Commit(ctx); err != nil {
			return err
		}
	}
	return nil
}

func Seed(ctx context.Context, pool *pgxpool.Pool, file string) error {
	body, err := os.ReadFile(file)
	if err != nil {
		return err
	}
	tx, err := pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if _, err = tx.Exec(ctx, string(body)); err != nil {
		return err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte("SistemaTKD2026!"), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `INSERT INTO users(id,school_id,owner_name,email,password_hash) VALUES('90000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Mariana Torres','maestra@sistematkd.local',$1) ON CONFLICT (id) DO UPDATE SET owner_name=EXCLUDED.owner_name,email=EXCLUDED.email,password_hash=EXCLUDED.password_hash`, string(hash))
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func ResetDemo(ctx context.Context, pool *pgxpool.Pool, file, schoolID string) error {
	body, err := os.ReadFile(file)
	if err != nil {
		return err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte("SistemaTKD2026!"), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	tx, err := pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	// users.school_id no se elimina en cascada: se borran primero los usuarios (y sus sesiones).
	if _, err = tx.Exec(ctx, `DELETE FROM users WHERE school_id=$1`, schoolID); err != nil {
		return err
	}
	if _, err = tx.Exec(ctx, `DELETE FROM schools WHERE id=$1`, schoolID); err != nil {
		return err
	}
	if _, err = tx.Exec(ctx, string(body)); err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `INSERT INTO users(id,school_id,owner_name,email,password_hash) VALUES('90000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Mariana Torres','maestra@sistematkd.local',$1) ON CONFLICT (id) DO UPDATE SET owner_name=EXCLUDED.owner_name,email=EXCLUDED.email,password_hash=EXCLUDED.password_hash`, string(hash))
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func HashToken(v string) string { sum := sha256.Sum256([]byte(v)); return hex.EncodeToString(sum[:]) }
func DemoNow(cfg Config) time.Time {
	location, err := time.LoadLocation(cfg.Timezone)
	if err != nil {
		location = time.UTC
	}
	if cfg.DemoMode {
		if t, e := time.ParseInLocation("2006-01-02", cfg.DemoDate, location); e == nil {
			return t
		}
	}
	return time.Now().In(location)
}
