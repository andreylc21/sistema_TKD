import { useState, type FormEvent, type ReactNode } from "react";
import { Dialog } from "./Dialog";
import { Notice } from "./PageHeader";

export type ConfirmField = {
  label: string;
  type?: "text" | "date";
  initial?: string;
  help?: string;
};

/**
 * Sustituye a confirm() y prompt(): conserva el foco, permite pedir un dato y muestra
 * dentro del diálogo el error de la operación para que no falle en silencio.
 */
export function ConfirmDialog({
  title,
  children,
  confirmLabel = "Confirmar",
  danger = false,
  field,
  onConfirm,
  onCancel,
}: {
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  field?: ConfirmField;
  onConfirm: (value: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(field?.initial ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (field && !value.trim()) {
      setError(`${field.label}: este dato es obligatorio.`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onConfirm(value.trim());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo completar la acción.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog title={title} onClose={() => !busy && onCancel()} guardChanges={false}>
      <form className="form-grid" onSubmit={submit}>
        {error && (
          <div className="full-span">
            <Notice kind="error">{error}</Notice>
          </div>
        )}
        {children && <div className="long-text full-span">{children}</div>}
        {field && (
          <div className="field full-span">
            <label htmlFor="confirm-field">{field.label}</label>
            <input
              id="confirm-field"
              type={field.type ?? "text"}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              required
            />
            {field.help && <p className="help">{field.help}</p>}
          </div>
        )}
        <div className="form-actions full-span">
          <button type="button" className="button secondary" disabled={busy} onClick={onCancel}>
            Cancelar
          </button>
          <button className={`button${danger ? " danger" : ""}`} disabled={busy}>
            {busy ? "Procesando…" : confirmLabel}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
