import { useState, type FormEvent } from "react";
import type { Bootstrap, Group } from "../../shared/api/contracts";
import { date } from "../../shared/lib/format";
import { goBack, navigate } from "../../shared/lib/navigation";
import { paths } from "../../shared/lib/paths";
import { ConfirmAction } from "../../shared/ui/ConfirmAction";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { DialogButton } from "../../shared/ui/DialogButton";
import { Notice } from "../../shared/ui/PageHeader";
import { overlappingGroups } from "./model/clases.model";
import { archiveGroup, assignStudent, createSession, moveStudent } from "./api/clases.api";

type Props = { group: Group; data: Bootstrap; reload: () => Promise<void> };

/** "Asignar alumno" en una ventana emergente. */
export function AssignStudentButton({ group, data, reload }: Props) {
  return (
    <DialogButton
      label="Asignar alumno"
      className="button small"
      title={`Asignar alumno a ${group.name}`}
    >
      {(close) => (
        <AssignForm
          group={group}
          data={data}
          onCancel={close}
          onSaved={async () => {
            close();
            await reload();
          }}
        />
      )}
    </DialogButton>
  );
}

function AssignForm({
  group,
  data,
  onCancel,
  onSaved,
}: {
  group: Group;
  data: Bootstrap;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const [error, setError] = useState("");

  async function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setError("");
    try {
      await assignStudent(group.id, {
        studentId: String(values.studentId),
        assignedFrom: String(values.assignedFrom),
      });
      await onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar la asignación.");
    }
  }

  return (
    <form className="form-grid" onSubmit={assign}>
      {error && (
        <div className="full-span">
          <Notice kind="error">{error}</Notice>
        </div>
      )}
      <div className="field full-span">
        <label htmlFor="assign-student">Alumno</label>
        <select id="assign-student" name="studentId" required>
          <option value="">Selecciona un alumno</option>
          {data.students
            .filter(
              (student) => student.status === "Activo" && !group.students.includes(student.id),
            )
            .map((student) => (
              <option value={student.id} key={student.id}>
                {student.name}
              </option>
            ))}
        </select>
      </div>
      <div className="field full-span">
        <label htmlFor="assigned-from">Vigente desde</label>
        <input
          id="assigned-from"
          name="assignedFrom"
          type="date"
          defaultValue={data.demoDate}
          required
        />
      </div>
      <div className="form-actions full-span">
        <button type="button" className="button danger" data-dialog-close onClick={onCancel}>
          Cancelar
        </button>
        <button className="button confirm">Aceptar</button>
      </div>
    </form>
  );
}

/** Archivar el grupo: lo oculta de las listas y saca a sus alumnos desde hoy. */
export function ArchiveGroupButton({ group, reload }: Pick<Props, "group" | "reload">) {
  const count = group.students.length;
  return (
    <ConfirmAction
      label="Archivar"
      title="Archivar grupo"
      onConfirm={async () => {
        await archiveGroup(group.id, { version: group.version });
        await reload();
        goBack(paths.grupos, { notice: "Grupo archivado.", force: true });
      }}
    >
      {group.name} dejará de aparecer en las listas y no podrá recibir alumnos ni clases nuevas. Su
      historial se conserva y puedes restaurarlo cuando quieras.
      {count > 0 &&
        ` Sus ${count} ${count === 1 ? "alumno quedará" : "alumnos quedarán"} sin horario desde hoy; si quieres, muévelos antes a otro grupo.`}
    </ConfirmAction>
  );
}

/** Quitar a un alumno del grupo desde hoy. */
export function RemoveStudentButton({
  group,
  studentId,
  studentName,
  today,
  reload,
}: {
  group: Group;
  studentId: string;
  studentName: string;
  today: string;
  reload: () => Promise<void>;
}) {
  return (
    <ConfirmAction
      label="Quitar"
      title="Quitar del grupo"
      onConfirm={async () => {
        await moveStudent(group.id, { studentId, date: today });
        await reload();
      }}
    >
      {studentName} saldrá de {group.name} desde hoy. Sus asistencias anteriores se conservan.
    </ConfirmAction>
  );
}

/** "Dar clase": abre la clase de hoy del grupo; si todavía no existe, la crea con el horario del grupo. */
export function GiveClassButton({ group, data, reload }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [asking, setAsking] = useState(false);
  const [start, end] = group.time.split("–");

  async function open() {
    setBusy(true);
    setError("");
    try {
      const existing = data.sessions.find(
        (session) =>
          session.groupId === group.id &&
          session.date === data.demoDate &&
          session.status === "Programada" &&
          session.startedAt !== null,
      );
      if (existing) {
        navigate(paths.sesion(group.id, existing.id));
        return;
      }
      const created = await createSession(
        { groupId: group.id, date: data.demoDate, start, end },
        crypto.randomUUID(),
      );
      await reload();
      navigate(paths.sesion(group.id, created.id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo abrir la clase.");
    } finally {
      setBusy(false);
    }
  }

  // Se puede dar clase cuando sea, esté o no programada. Si la clase de hoy ya existe se abre sin
  // preguntar; si no, se confirma antes de crearla y se avisa si otro grupo tiene clase a esa hora.
  function ask() {
    const exists = data.sessions.some(
      (session) =>
        session.groupId === group.id &&
        session.date === data.demoDate &&
        session.status === "Programada" &&
        session.startedAt !== null,
    );
    if (exists) void open();
    else setAsking(true);
  }
  const others = overlappingGroups(data, group, data.demoDate);

  return (
    <>
      <button className="button small" disabled={busy} onClick={ask}>
        {busy ? "Abriendo…" : "Dar clase"}
      </button>
      {error && (
        <span className="field-error" role="alert">
          {error}
        </span>
      )}
      {asking && (
        <ConfirmDialog
          title="Dar clase"
          onConfirm={async () => {
            setAsking(false);
            await open();
          }}
          onCancel={() => setAsking(false)}
        >
          ¿Dar la clase de {group.name} hoy, {date(data.demoDate)}, de {group.time}?
          {others.length > 0 &&
            ` Ojo: ${others.map((other) => `${other.name} (${other.time})`).join(" y ")} ${others.length === 1 ? "tiene" : "tienen"} clase a la misma hora.`}
        </ConfirmDialog>
      )}
    </>
  );
}
