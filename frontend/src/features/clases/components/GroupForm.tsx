import { type FormEvent } from "react";
import type { Group, GroupWrite } from "../../../shared/api/contracts";
import { TimeRangeFields } from "../../../shared/ui/TimeRangeFields";

const weekDays = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;

export function GroupForm({
  initial,
  busy = false,
  onSubmit,
  onCancel,
}: {
  initial?: Group;
  busy?: boolean;
  onSubmit: (body: GroupWrite) => Promise<void>;
  onCancel?: () => void;
}) {
  const [start = "", end = ""] = initial?.time.split("–") ?? [];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    await onSubmit({
      name: String(values.name).trim(),
      days: [...form.querySelectorAll<HTMLInputElement>('[name="days"]:checked')].map(
        (input) => input.value,
      ) as GroupWrite["days"],
      start: String(values.start),
      end: String(values.end),
      minAge: values.minAge === "" ? null : Number(values.minAge),
      maxAge: values.maxAge === "" ? null : Number(values.maxAge),
      ...(initial ? { version: initial.version } : {}),
    });
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      <div className="field full-span">
        <label htmlFor="group-name">Nombre</label>
        <input id="group-name" name="name" defaultValue={initial?.name} required />
      </div>
      <fieldset className="full-span">
        <legend>Días</legend>
        <div className="check-row">
          {weekDays.map((day) => (
            <label className="check" key={day}>
              <input
                type="checkbox"
                name="days"
                value={day}
                defaultChecked={initial?.days.includes(day)}
              />{" "}
              {day}
            </label>
          ))}
        </div>
      </fieldset>
      <TimeRangeFields
        idPrefix="group"
        startLabel="Hora de inicio"
        endLabel="Hora de fin"
        initialStart={start}
        initialEnd={end}
      />
      <div className="field">
        <label htmlFor="group-min-age">
          Edad mínima <span>(opcional)</span>
        </label>
        <input
          id="group-min-age"
          name="minAge"
          type="number"
          min="0"
          defaultValue={initial?.minAge ?? ""}
        />
      </div>
      <div className="field">
        <label htmlFor="group-max-age">
          Edad máxima <span>(opcional)</span>
        </label>
        <input
          id="group-max-age"
          name="maxAge"
          type="number"
          min="0"
          defaultValue={initial?.maxAge ?? ""}
        />
      </div>
      <div className="form-actions full-span">
        {onCancel && (
          <button type="button" className="button secondary" onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button className="button" disabled={busy}>
          {busy ? "Guardando…" : initial ? "Guardar grupo" : "Crear grupo"}
        </button>
      </div>
    </form>
  );
}
