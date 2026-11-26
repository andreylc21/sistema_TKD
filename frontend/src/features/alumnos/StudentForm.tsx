import { useRef, useState, type FormEvent, type ReactNode } from "react";
import type { Grade, Group, Student, StudentWrite } from "../../shared/api/contracts";
import { date } from "../../shared/lib/format";
import { Notice } from "../../shared/ui/PageHeader";
import { assignStudent } from "../clases/api/clases.api";
import { createStudent, updateStudent } from "./api/alumnos.api";
function isAdult(birthDate: string, today: string) {
  const [year, month, day] = birthDate.split("-").map(Number);
  const [nowYear, nowMonth, nowDay] = today.split("-").map(Number);
  return (
    nowYear - year > 18 ||
    (nowYear - year === 18 && (nowMonth > month || (nowMonth === month && nowDay >= day)))
  );
}

const relations = ["Madre", "Padre", "Tutor", "Otra"];
const phoneDigits = (value: string) => value.replace(/[\s().-]/g, "");
const phoneValid = (value: string) => /^\d{10}$/.test(phoneDigits(value));
const emailValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
type Errors = Record<string, string>;

/** Campo con etiqueta, ayuda opcional y error propio enlazado con aria-describedby. */
function Field({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string;
  label: ReactNode;
  required?: boolean;
  hint?: string;
  error?: string;
  children: (props: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
  }) => ReactNode;
}) {
  const describedBy = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean);
  return (
    <div className="field">
      <label htmlFor={id}>
        {label} {required && <b aria-hidden="true">*</b>}
      </label>
      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": describedBy.length ? describedBy.join(" ") : undefined,
      })}
      {hint && (
        <span id={`${id}-hint`} className="field-hint">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${id}-error`} className="field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

function RelationSelect({
  props,
  name,
  defaultValue,
}: {
  props: Record<string, unknown>;
  name: string;
  defaultValue?: string;
}) {
  const options =
    defaultValue && !relations.includes(defaultValue) ? [...relations, defaultValue] : relations;
  return (
    <select {...props} name={name} defaultValue={defaultValue ?? ""}>
      <option value="">Selecciona una relación</option>
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );
}

export function StudentForm({
  grades,
  groups,
  today,
  initial,
  onSaved,
  onCancel,
  readOnly = false,
}: {
  grades: Grade[];
  groups: Group[];
  today: string;
  initial?: Student;
  onSaved: () => Promise<void>;
  onCancel: () => void;
  /** Muestra el expediente completo sin poder editarlo; sin pie de acciones ni leyenda de obligatorios. */
  readOnly?: boolean;
}) {
  // Los alumnos antiguos con emergencia igual al principal se muestran sin contacto de emergencia.
  const emergency =
    initial && initial.emergencyPhone && initial.emergencyPhone !== initial.primaryPhone
      ? {
          name: initial.emergencyName,
          relation: initial.emergencyRelation,
          phone: initial.emergencyPhone,
        }
      : undefined;
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const creationKey = useRef(crypto.randomUUID());
  function validate(v: Record<string, FormDataEntryValue>) {
    const found: Errors = {};
    const text = (name: string) => String(v[name] ?? "").trim();
    const need = (name: string, message: string) => {
      if (!text(name)) found[name] = message;
    };
    need("firstNames", "Escribe el nombre del alumno.");
    need("lastNames", "Escribe los apellidos del alumno.");
    need("birthDate", "Indica la fecha de nacimiento.");
    need("gradeId", "Selecciona el grado actual.");
    if (!initial) need("enrollmentDate", "Indica la fecha de inscripción.");
    if (text("email") && !emailValid(text("email"))) found.email = "Escribe un correo válido.";
    if (text("phone") && !phoneValid(text("phone")))
      found.phone = "El teléfono debe tener 10 dígitos.";
    if (!("healthConsent" in v))
      found.healthConsent = "Debes autorizar el tratamiento de los datos.";
    const day = Number(v.billingDay);
    if (!Number.isInteger(day) || day < 1 || day > 31)
      found.billingDay = "Indica un día entre 1 y 31.";
    need("primaryName", "Escribe el nombre del contacto.");
    need("primaryRelation", "Selecciona la relación con el alumno.");
    if (!text("primaryPhone")) found.primaryPhone = "Escribe un teléfono de 10 dígitos.";
    else if (!phoneValid(text("primaryPhone")))
      found.primaryPhone = "El teléfono debe tener 10 dígitos.";
    const emergency = ["emergencyName", "emergencyRelation", "emergencyPhone"];
    if (emergency.some((name) => text(name))) {
      need("emergencyName", "Escribe el nombre del contacto de emergencia.");
      need("emergencyRelation", "Selecciona la relación con el alumno.");
      if (!text("emergencyPhone")) found.emergencyPhone = "Escribe un teléfono de 10 dígitos.";
      else if (!phoneValid(text("emergencyPhone")))
        found.emergencyPhone = "El teléfono debe tener 10 dígitos.";
      else if (phoneDigits(text("emergencyPhone")) === phoneDigits(text("primaryPhone")))
        found.emergencyPhone = "Debe ser distinto al teléfono del contacto principal.";
    }
    return found;
  }
  function clearError(event: FormEvent<HTMLFormElement>) {
    const name = (event.target as HTMLInputElement).name;
    if (!name || !errors[name]) return;
    setErrors((previous) => {
      const next = { ...previous };
      delete next[name];
      return next;
    });
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    const v = Object.fromEntries(new FormData(f));
    const found = validate(v);
    setErrors(found);
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      setError("");
      (f.elements.namedItem(firstInvalid) as HTMLElement | null)?.focus();
      return;
    }
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
      primaryPhone: phoneDigits(String(v.primaryPhone)),
      emergencyName: String(v.emergencyName || ""),
      emergencyRelation: String(v.emergencyRelation || ""),
      emergencyPhone: phoneDigits(String(v.emergencyPhone || "")),
      restrictions: String(v.restrictions || ""),
      healthConsent,
      phone: phoneDigits(String(v.phone || "")),
      enrollmentDate: String(initial?.enrollmentDate || v.enrollmentDate),
      billingDay: Number(v.billingDay),
      version: initial?.version,
    };
    setBusy(true);
    setError("");
    try {
      if (initial) await updateStudent(initial.id, body);
      else {
        const created = await createStudent(body, creationKey.current);
        // El horario se elige al registrar: cada grupo marcado queda asignado desde la inscripción.
        for (const groupId of new FormData(f).getAll("groupIds"))
          await assignStudent(String(groupId), {
            studentId: created.id,
            assignedFrom: body.enrollmentDate,
          });
      }
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className={`form-grid${readOnly ? " readonly" : ""}`}
      onSubmit={submit}
      onInput={clearError}
      noValidate
    >
      <fieldset className="form-body" disabled={readOnly}>
        {error && (
          <div className="full-span">
            <Notice kind="error">{error}</Notice>
          </div>
        )}
        {!readOnly && (
          <p className="required-legend full-span">
            <b aria-hidden="true">*</b> Campo obligatorio
          </p>
        )}
        <div className="form-col">
          <Field id="firstNames" label="Nombre(s)" required error={errors.firstNames}>
            {(a) => (
              <input
                {...a}
                name="firstNames"
                defaultValue={initial?.firstNames}
                placeholder="Ej. María Fernanda"
              />
            )}
          </Field>
          <Field id="lastNames" label="Apellido(s)" required error={errors.lastNames}>
            {(a) => (
              <input
                {...a}
                name="lastNames"
                defaultValue={initial?.lastNames}
                placeholder="Ej. López Camal"
              />
            )}
          </Field>
          <Field id="birthDate" label="Fecha de nacimiento" required error={errors.birthDate}>
            {(a) => (
              <input
                {...a}
                name="birthDate"
                type={readOnly && initial ? "text" : "date"}
                max={today}
                defaultValue={readOnly && initial ? date(initial.birthDate) : initial?.birthDate}
              />
            )}
          </Field>
          <Field id="gradeId" label="Grado actual" required error={errors.gradeId}>
            {(a) => (
              <select {...a} name="gradeId" defaultValue={initial?.gradeId}>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field
            id="email"
            label={
              <>
                Correo <span>(opcional)</span>
              </>
            }
            error={errors.email}
          >
            {(a) => (
              <input
                {...a}
                name="email"
                type="email"
                defaultValue={initial?.email}
                placeholder="Ej. nombre@correo.com"
              />
            )}
          </Field>
          <Field
            id="phone"
            label={
              <>
                Teléfono del alumno <span>(opcional)</span>
              </>
            }
            hint="10 dígitos, sin espacios ni guiones."
            error={errors.phone}
          >
            {(a) => (
              <input
                {...a}
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="10 dígitos"
                defaultValue={initial?.phone}
              />
            )}
          </Field>
          <Field
            id="enrollmentDate"
            label="Fecha de inscripción"
            required
            error={errors.enrollmentDate}
          >
            {(a) => (
              <input
                {...a}
                name="enrollmentDate"
                type={initial ? "text" : "date"}
                defaultValue={initial ? date(initial.enrollmentDate) : today}
                disabled={Boolean(initial)}
              />
            )}
          </Field>
          <Field
            id="billingDay"
            label="Día mensual de pago"
            required
            hint="Si el mes es más corto, se cobra el último día del mes."
            error={errors.billingDay}
          >
            {(a) => (
              <input
                {...a}
                name="billingDay"
                type="number"
                min="1"
                max="31"
                defaultValue={initial?.billingDay || 1}
              />
            )}
          </Field>
          {!initial && (
            <fieldset className="full-span">
              <legend>
                Horario de clases <span>(opcional)</span>
              </legend>
              {groups.length ? (
                <div className="check-row">
                  {groups.map((group) => (
                    <label key={group.id} className="check">
                      <input type="checkbox" name="groupIds" value={group.id} />
                      {group.name} · {group.days.join(", ")} · {group.time}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="muted">
                  Aún no hay horarios. Créalos en Clases y después asígnalos aquí o desde el grupo.
                </p>
              )}
            </fieldset>
          )}
        </div>
        <div className="form-col">
          <h3 className="full-span form-section">Contacto principal</h3>
          <Field id="primaryName" label="Nombre" required error={errors.primaryName}>
            {(a) => (
              <input
                {...a}
                name="primaryName"
                defaultValue={initial?.primaryName}
                placeholder="Ej. Patricia Camal"
              />
            )}
          </Field>
          <Field id="primaryRelation" label="Relación" required error={errors.primaryRelation}>
            {(a) => (
              <RelationSelect
                props={a}
                name="primaryRelation"
                defaultValue={initial?.primaryRelation}
              />
            )}
          </Field>
          <Field
            id="primaryPhone"
            label="Teléfono"
            required
            hint="10 dígitos, sin espacios ni guiones."
            error={errors.primaryPhone}
          >
            {(a) => (
              <input
                {...a}
                name="primaryPhone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="10 dígitos"
                defaultValue={initial?.primaryPhone}
              />
            )}
          </Field>
          <h3 className="full-span form-section">
            Contacto de emergencia <span>(opcional)</span>
          </h3>
          <Field id="emergencyName" label="Nombre" error={errors.emergencyName}>
            {(a) => (
              <input
                {...a}
                name="emergencyName"
                defaultValue={emergency?.name}
                placeholder="Ej. Luis Pérez"
              />
            )}
          </Field>
          <Field id="emergencyRelation" label="Relación" error={errors.emergencyRelation}>
            {(a) => (
              <RelationSelect
                props={a}
                name="emergencyRelation"
                defaultValue={emergency?.relation}
              />
            )}
          </Field>
          <Field
            id="emergencyPhone"
            label="Teléfono"
            hint="10 dígitos, distinto al del contacto principal."
            error={errors.emergencyPhone}
          >
            {(a) => (
              <input
                {...a}
                name="emergencyPhone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="10 dígitos"
                defaultValue={emergency?.phone}
              />
            )}
          </Field>
          <h3 className="full-span form-section">
            Salud <span>(opcional)</span>
          </h3>
          <div className="field full-span">
            <label htmlFor="restrictions">Alergias, condiciones o restricciones</label>
            <textarea
              id="restrictions"
              name="restrictions"
              defaultValue={initial?.restrictions}
              placeholder="Ej. Alergia a la penicilina; asma leve"
            />
          </div>
          <div className="full-span">
            <label className="check">
              <input
                name="healthConsent"
                type="checkbox"
                defaultChecked={initial?.healthConsent}
                aria-invalid={Boolean(errors.healthConsent)}
              />{" "}
              Autorizo el tratamiento de los datos personales y de salud del alumno{" "}
              <b aria-hidden="true">*</b>
            </label>
            {errors.healthConsent && (
              <span className="field-error" role="alert">
                {errors.healthConsent}
              </span>
            )}
          </div>
        </div>
      </fieldset>
      {!readOnly && (
        <div className="form-actions full-span">
          <button type="button" className="button danger" onClick={onCancel}>
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
