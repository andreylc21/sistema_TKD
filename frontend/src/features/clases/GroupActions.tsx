import { useRef, useState, type FormEvent } from "react";
import type { Bootstrap, Group } from "../../shared/api/contracts";
import { Dialog } from "../../shared/ui/Dialog";
import { Notice } from "../../shared/ui/PageHeader";
import { assignStudent, createSession, updateGroup } from "./api/clases.api";
import { GroupForm } from "./components/GroupForm";

type DialogName = "assign" | "session" | "edit" | null;

export function GroupActions({
  group,
  data,
  reload,
  onSession,
}: {
  group: Group;
  data: Bootstrap;
  reload: () => Promise<void>;
  onSession: (sessionId: string) => void;
}) {
  const [dialog, setDialog] = useState<DialogName>(null);
  const [error, setError] = useState("");
  const sessionKey = useRef(crypto.randomUUID());
  const [start, end] = group.time.split("–");

  async function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setError("");
    try {
      await assignStudent(group.id, {
        studentId: String(values.studentId),
        assignedFrom: String(values.assignedFrom),
      });
      setDialog(null);
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar la asignación.");
    }
  }

  async function addSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setError("");
    try {
      const created = await createSession(
        {
          groupId: group.id,
          date: String(values.date),
          start: String(values.start),
          end: String(values.end),
        },
        sessionKey.current,
      );
      sessionKey.current = crypto.randomUUID();
      setDialog(null);
      await reload();
      onSession(created.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo programar la clase.");
    }
  }

  async function editGroup(body: Parameters<typeof updateGroup>[1]) {
    setError("");
    try {
      await updateGroup(group.id, body);
      setDialog(null);
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo actualizar el grupo.");
    }
  }

  return (
    <>
      <div className="inline-actions group-actions">
        <button className="text-button" onClick={() => setDialog("edit")}>
          Editar grupo
        </button>
        <button className="text-button" onClick={() => setDialog("assign")}>
          Asignar alumno
        </button>
        <button className="button secondary small" onClick={() => setDialog("session")}>
          Programar clase
        </button>
      </div>
      {dialog === "assign" && (
        <Dialog title={`Asignar alumno a ${group.name}`} onClose={() => setDialog(null)}>
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
                    (student) =>
                      student.status === "Activo" && !group.students.includes(student.id),
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
              <button
                type="button"
                className="button secondary"
                data-dialog-close
                onClick={() => setDialog(null)}
              >
                Cancelar
              </button>
              <button className="button">Guardar asignación</button>
            </div>
          </form>
        </Dialog>
      )}
      {dialog === "session" && (
        <Dialog title={`Programar clase de ${group.name}`} onClose={() => setDialog(null)}>
          <form className="form-grid" onSubmit={addSession}>
            {error && (
              <div className="full-span">
                <Notice kind="error">{error}</Notice>
              </div>
            )}
            <div className="field full-span">
              <label htmlFor="session-date">Fecha</label>
              <input
                id="session-date"
                name="date"
                type="date"
                defaultValue={data.demoDate}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="session-start">Inicio</label>
              <input id="session-start" name="start" type="time" defaultValue={start} required />
            </div>
            <div className="field">
              <label htmlFor="session-end">Fin</label>
              <input id="session-end" name="end" type="time" defaultValue={end} required />
            </div>
            <div className="form-actions full-span">
              <button
                type="button"
                className="button secondary"
                data-dialog-close
                onClick={() => setDialog(null)}
              >
                Cancelar
              </button>
              <button className="button">Programar y abrir</button>
            </div>
          </form>
        </Dialog>
      )}
      {dialog === "edit" && (
        <Dialog title={`Editar ${group.name}`} onClose={() => setDialog(null)}>
          {error && <Notice kind="error">{error}</Notice>}
          <GroupForm initial={group} onSubmit={editGroup} onCancel={() => setDialog(null)} />
        </Dialog>
      )}
    </>
  );
}
