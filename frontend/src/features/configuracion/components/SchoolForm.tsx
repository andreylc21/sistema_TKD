import { useState, type FormEvent } from "react";
import type { Bootstrap } from "../../../shared/api/contracts";
import { date } from "../../../shared/lib/format";
import { Notice } from "../../../shared/ui/PageHeader";
import { updateSchool } from "../api/configuracion.api";

/** Datos de la escuela con el mismo formato de las fichas: planos en lectura, editables al pulsar Editar. */
export function SchoolForm({
  school,
  today,
  readOnly,
  onDone,
  onCancel,
}: {
  school: Bootstrap["school"];
  /** Fecha operativa; solo se muestra, no se edita. */
  today: string;
  readOnly: boolean;
  onDone: () => Promise<void>;
  onCancel: () => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError("");
    try {
      await updateSchool({
        name: String(values.name),
        owner: String(values.owner),
        fee: String(values.fee),
      });
      await onDone();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudieron guardar los datos.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className={`form-grid${readOnly ? " readonly" : ""}`} onSubmit={submit}>
      <fieldset className="form-body" disabled={readOnly}>
        {error && (
          <div className="full-span">
            <Notice kind="error">{error}</Notice>
          </div>
        )}
        <div className="field">
          <label htmlFor="school-name">Escuela</label>
          <input
            id="school-name"
            name="name"
            defaultValue={school.name}
            maxLength={80}
            required
            placeholder="Ej. Academia Ji Do Kwan"
          />
        </div>
        <div className="field">
          <label htmlFor="school-owner">Propietaria</label>
          <input
            id="school-owner"
            name="owner"
            defaultValue={school.owner}
            maxLength={80}
            required
            placeholder="Ej. Mariana Torres"
          />
        </div>
        <div className="field">
          <label htmlFor="school-fee">Mensualidad general</label>
          <input
            id="school-fee"
            name="fee"
            type="number"
            min="0"
            step="0.01"
            defaultValue={school.fee.toFixed(2)}
            required
            placeholder="Ej. 850.00"
          />
          {!readOnly && (
            <span className="field-hint">
              El nuevo monto aplica a las mensualidades que se generen desde ahora; las que ya
              existen no cambian.
            </span>
          )}
        </div>
        <div className="field">
          <label htmlFor="school-today">Fecha operativa</label>
          <input id="school-today" value={date(today)} readOnly disabled />
        </div>
      </fieldset>
      {!readOnly && (
        <div className="form-actions full-span">
          <button type="button" className="button danger" disabled={busy} onClick={onCancel}>
            Cancelar
          </button>
          <button className="button confirm" disabled={busy}>
            {busy ? "Guardando…" : "Aceptar"}
          </button>
        </div>
      )}
    </form>
  );
}
