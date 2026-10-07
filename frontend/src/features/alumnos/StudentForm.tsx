import { useRef, useState, type FormEvent } from "react";
import type { Grade, Student, StudentWrite } from "../../shared/api/contracts";
import { Notice } from "../../shared/ui/PageHeader";
import { createStudent, updateStudent } from "./api/alumnos.api";
function isAdult(birthDate: string, today: string) {
  const [year, month, day] = birthDate.split("-").map(Number);
  const [nowYear, nowMonth, nowDay] = today.split("-").map(Number);
  return (
    nowYear - year > 18 ||
    (nowYear - year === 18 && (nowMonth > month || (nowMonth === month && nowDay >= day)))
  );
}

export function StudentForm({
  grades,
  today,
  initial,
  onSaved,
  onCancel,
}: {
  grades: Grade[];
  today: string;
  initial?: Student;
  onSaved: () => Promise<void>;
  onCancel: () => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const creationKey = useRef(crypto.randomUUID());
  const [reuse, setReuse] = useState(
    Boolean(
      initial &&
      initial.primaryName === initial.emergencyName &&
      initial.primaryPhone === initial.emergencyPhone,
    ),
  );
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    const v = Object.fromEntries(new FormData(f));
    const healthConsent = (f.elements.namedItem("healthConsent") as HTMLInputElement).checked;
    const owner: StudentWrite["emailOwner"] =
      initial?.emailOwner === "alumno" || initial?.emailOwner === "responsable"
        ? initial.emailOwner
        : isAdult(String(v.birthDate), today)
          ? "alumno"
          : "responsable";
    const body: StudentWrite = {
      firstNames: String(v.firstNames),
      lastNames: String(v.lastNames),
      birthDate: String(v.birthDate),
      gradeId: String(v.gradeId),
      email: String(v.email || ""),
      emailOwner: v.email ? owner : "",
      primaryName: String(v.primaryName),
      primaryRelation: String(v.primaryRelation),
      primaryPhone: String(v.primaryPhone),
      emergencyName: String(reuse ? v.primaryName : v.emergencyName),
      emergencyRelation: String(reuse ? v.primaryRelation : v.emergencyRelation),
      emergencyPhone: String(reuse ? v.primaryPhone : v.emergencyPhone),
      restrictions: String(v.restrictions || ""),
      healthConsent,
      enrollmentDate: String(initial?.enrollmentDate || v.enrollmentDate),
      billingDay: Number(v.billingDay),
      version: initial?.version,
    };
    setBusy(true);
    setError("");
    try {
      if (initial) await updateStudent(initial.id, body);
      else await createStudent(body, creationKey.current);
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="form-grid" onSubmit={submit}>
      {error && (
        <div className="full-span">
          <Notice kind="error">{error}</Notice>
        </div>
      )}
      <div className="field">
        <label htmlFor="firstNames">
          Nombre(s) <b>*</b>
        </label>
        <input id="firstNames" name="firstNames" defaultValue={initial?.firstNames} required />
      </div>
      <div className="field">
        <label htmlFor="lastNames">
          Apellido(s) <b>*</b>
        </label>
        <input id="lastNames" name="lastNames" defaultValue={initial?.lastNames} required />
      </div>
      <div className="field">
        <label htmlFor="birthDate">
          Fecha de nacimiento <b>*</b>
        </label>
        <input
          id="birthDate"
          name="birthDate"
          type="date"
          max={today}
          defaultValue={initial?.birthDate}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="gradeId">
          Grado actual <b>*</b>
        </label>
        <select id="gradeId" name="gradeId" defaultValue={initial?.gradeId} required>
          {grades.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="email">
          Correo <span>(opcional)</span>
        </label>
        <input id="email" name="email" type="email" defaultValue={initial?.email} />
      </div>
      <div className="field">
        <label htmlFor="enrollmentDate">
          Fecha de inscripción <b>*</b>
        </label>
        <input
          id="enrollmentDate"
          name="enrollmentDate"
          type="date"
          defaultValue={initial?.enrollmentDate || today}
          required
          disabled={Boolean(initial)}
        />
      </div>
      <div className="field">
        <label htmlFor="billingDay">
          Día mensual de pago <b>*</b>
        </label>
        <input
          id="billingDay"
          name="billingDay"
          type="number"
          min="1"
          max="31"
          defaultValue={initial?.billingDay || 1}
          required
        />
      </div>
      <div />
      <h3 className="full-span form-section">Contacto principal o responsable</h3>
      <div className="field">
        <label htmlFor="primaryName">
          Nombre <b>*</b>
        </label>
        <input id="primaryName" name="primaryName" defaultValue={initial?.primaryName} required />
      </div>
      <div className="field">
        <label htmlFor="primaryRelation">
          Relación <b>*</b>
        </label>
        <input
          id="primaryRelation"
          name="primaryRelation"
          defaultValue={initial?.primaryRelation}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="primaryPhone">
          Teléfono <b>*</b>
        </label>
        <input
          id="primaryPhone"
          name="primaryPhone"
          type="tel"
          defaultValue={initial?.primaryPhone}
          required
        />
      </div>
      <label className="check">
        <input type="checkbox" checked={reuse} onChange={(e) => setReuse(e.target.checked)} />{" "}
        Reutilizar como contacto de emergencia
      </label>
      {!reuse && (
        <>
          <div className="field">
            <label htmlFor="emergencyName">
              Contacto de emergencia <b>*</b>
            </label>
            <input
              id="emergencyName"
              name="emergencyName"
              defaultValue={initial?.emergencyName}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="emergencyRelation">
              Relación <b>*</b>
            </label>
            <input
              id="emergencyRelation"
              name="emergencyRelation"
              defaultValue={initial?.emergencyRelation}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="emergencyPhone">
              Teléfono <b>*</b>
            </label>
            <input
              id="emergencyPhone"
              name="emergencyPhone"
              type="tel"
              defaultValue={initial?.emergencyPhone}
              required
            />
          </div>
        </>
      )}
      <h3 className="full-span form-section">
        Salud <span>(opcional)</span>
      </h3>
      <div className="field full-span">
        <label htmlFor="restrictions">Alergias, condiciones o restricciones</label>
        <textarea id="restrictions" name="restrictions" defaultValue={initial?.restrictions} />
      </div>
      <label className="check full-span">
        <input name="healthConsent" type="checkbox" defaultChecked={initial?.healthConsent} />{" "}
        Autorización para tratar esta información de salud
      </label>
      <div className="form-actions full-span">
        <button type="button" className="button secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button className="button" disabled={busy}>
          {busy ? "Guardando…" : initial ? "Guardar cambios" : "Guardar alumno"}
        </button>
      </div>
    </form>
  );
}
