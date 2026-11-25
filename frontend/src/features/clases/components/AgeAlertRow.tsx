import { useState, type FormEvent } from "react";
import type { Bootstrap } from "../../../shared/api/contracts";
import { Dialog } from "../../../shared/ui/Dialog";
import { Notice } from "../../../shared/ui/PageHeader";
import { keepStudent, moveStudent } from "../api/clases.api";
import { ageLabel, type AgeAlert } from "../model/clases.model";

/** Aviso de "ya no entra en el grupo" con sus dos salidas: mover al alumno o mantenerlo. */
export function AgeAlertRow({
  alert,
  data,
  reload,
  showGroup = false,
}: {
  alert: AgeAlert;
  data: Bootstrap;
  reload: () => Promise<void>;
  showGroup?: boolean;
}) {
  const { student, group, reason } = alert;
  const [moving, setMoving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const destinations = data.groups.filter((item) => item.id !== group.id);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
      setMoving(false);
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo completar la acción.");
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    return run(() =>
      moveStudent(group.id, {
        studentId: student.id,
        toGroupId: String(values.toGroupId) || undefined,
        date: String(values.date),
      }),
    );
  }

  return (
    <div className="age-alert">
      <p>
        <strong>{student.name}</strong> · {reason}
        {showGroup && <> ({group.name})</>}
      </p>
      {error && !moving && <Notice kind="error">{error}</Notice>}
      <div className="inline-actions">
        <button className="button small" disabled={busy} onClick={() => setMoving(true)}>
          Mover de grupo
        </button>
        <button
          className="button secondary small"
          disabled={busy}
          onClick={() => run(() => keepStudent(group.id, { studentId: student.id }))}
        >
          Mantener aquí
        </button>
      </div>
      {moving && (
        <Dialog title={`Mover a ${student.name}`} onClose={() => setMoving(false)}>
          <form className="form-grid" onSubmit={submit}>
            {error && (
              <div className="full-span">
                <Notice kind="error">{error}</Notice>
              </div>
            )}
            <div className="field full-span">
              <label htmlFor="move-to">Nuevo grupo</label>
              <select id="move-to" name="toGroupId" defaultValue="">
                <option value="">Solo retirarlo de {group.name}</option>
                {destinations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {ageLabel(item)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field full-span">
              <label htmlFor="move-date">Vigente desde</label>
              <input id="move-date" name="date" type="date" defaultValue={data.demoDate} required />
            </div>
            <div className="form-actions full-span">
              <button
                type="button"
                className="button secondary"
                data-dialog-close
                onClick={() => setMoving(false)}
              >
                Cancelar
              </button>
              <button className="button" disabled={busy}>
                Mover
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
