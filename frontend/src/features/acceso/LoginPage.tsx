import { useState, type FormEvent } from "react";
import { login } from "./api/acceso.api";
export function LoginPage({ onSuccess }: { onSuccess: () => Promise<void> }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await login(String(form.get("email")), String(form.get("password")));
      await onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible iniciar sesión.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand-mark" aria-hidden="true">
          TKD
        </div>
        <h1>Inicia sesión</h1>
        <p>Consulta alumnos, organiza clases y lleva el control de pagos de tu escuela.</p>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <div className="field">
          <label htmlFor="login-email">Correo</label>
          <input
            id="login-email"
            name="email"
            type="email"
            placeholder="tu-correo@escuela.com"
            autoComplete="username"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="login-password">Contraseña</label>
          <input
            id="login-password"
            name="password"
            type="password"
            placeholder="Tu contraseña"
            autoComplete="current-password"
            required
          />
        </div>
        <button className="button full" disabled={busy}>
          {busy ? "Entrando…" : "Entrar a Sistema TKD"}
        </button>
        <p className="login-help">Acceso reservado para la administración de la escuela.</p>
      </form>
    </main>
  );
}
