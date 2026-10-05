import { useState, type FormEvent } from "react";
import type { Attendance, Bootstrap, Session } from "../../../shared/api/contracts";
import { date } from "../../../shared/lib/format";
import { ConfirmDialog } from "../../../shared/ui/ConfirmDialog";
import { Dialog } from "../../../shared/ui/Dialog";
import { Empty, Notice, PageHeader } from "../../../shared/ui/PageHeader";
import { NoteForm } from "../../alumnos/components/NoteForm";
import { inviteParticipant, updateAttendance, updateSessionStatus } from "../api/clases.api";

const attendanceStatuses: Attendance["status"][] = [
  "Sin registrar",
  "Presente",
  "Ausente",
  "Falta justificada",
];

export function SessionDetail({
  data,
  session,
  reload,
  onBack,
  onStudent,
}: {
  data: Bootstrap;
  session: Session;
  reload: () => Promise<void>;
  onBack: () => void;
  onStudent: (studentId: string) => void;
}) {
  const [showInvite, setShowInvite] = useState(false);
  const [commentEntry, setCommentEntry] = useState<Attendance>();
  const [restrictionStudentId, setRestrictionStudentId] = useState<string>();
  const [noteStudentId, setNoteStudentId] = useState<string>();
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [statusAction, setStatusAction] = useState<"Cancelada" | "Reprogramada">();
  const current = data.sessions.find((item) => item.id === session.id) ?? session;
  const group = data.groups.find((item) => item.id === current.groupId);
  const editable = current.status === "Programada";

  if (!group) return <Empty title="Grupo no disponible" text="Recarga para consultar la clase." />;
  const attendance = current.attendance;
  const commentStudent = commentEntry
    ? data.students.find((item) => item.id === commentEntry.studentId)
    : undefined;
  const restrictionStudent = data.students.find((item) => item.id === restrictionStudentId);
  const noteStudent = data.students.find((item) => item.id === noteStudentId);

  async function saveStatus(entry: Attendance, status: Attendance["status"]) {
    setError("");
    setMessage("");
    try {
      await updateAttendance(current.id, entry.studentId, {
        status,
        observation: entry.observation,
        version: entry.version,
      });
      await reload();
      setMessage("Asistencia actualizada.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar la asistencia.");
    }
  }

  async function saveComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!commentEntry) return;
    setBusy(true);
    setError("");
    try {
      await updateAttendance(current.id, commentEntry.studentId, {
        status: commentEntry.status,
        observation: comment.trim(),
        version: commentEntry.version,
      });
      await reload();
      setCommentEntry(undefined);
      setMessage("Comentario de asistencia guardado.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar el comentario.");
    } finally {
      setBusy(false);
    }
  }

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setError("");
    try {
      await inviteParticipant(current.id, { studentId: String(values.studentId) });
      setShowInvite(false);
      await reload();
      setMessage("Alumno agregado a esta clase.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo agregar el alumno.");
    }
  }

  async function changeStatus(status: "Cancelada" | "Reprogramada", newDate = "") {
    if (status === "Cancelada") {
      await updateSessionStatus(current.id, { status, version: current.version });
    } else {
      const [start, end] = current.time.split("–");
      await updateSessionStatus(current.id, {
        status,
        version: current.version,
        date: newDate,
        start,
        end,
      });
    }
    setStatusAction(undefined);
    await reload();
    setMessage(
      status === "Cancelada"
        ? "Clase cancelada; no generó faltas."
        : `Clase reprogramada para el ${date(newDate)}.`,
    );
  }

  return (
    <>
      <button className="text-button detail-back" onClick={onBack}>
        ← Volver a clases
      </button>
      <PageHeader
        title={group.name}
        help="Registra la asistencia y conserva comentarios propios de esta clase. Las notas de seguimiento se guardan aparte en el expediente."
        context={
          <span>
            {date(current.date)} · {current.time} · <strong>{current.status}</strong> ·
            Participantes: {attendance.length}
          </span>
        }
        actions={
          editable ? (
            <>
              <button className="button secondary" onClick={() => setStatusAction("Reprogramada")}>
                Reprogramar
              </button>
              <button
                className="button secondary danger"
                onClick={() => setStatusAction("Cancelada")}
              >
                Cancelar clase
              </button>
              <button className="button" onClick={() => setShowInvite(true)}>
                Agregar alumno
              </button>
            </>
          ) : undefined
        }
      />
      {error && !commentEntry && <Notice kind="error">{error}</Notice>}
      {message && <Notice>{message}</Notice>}
      {!editable && (
        <div className="context-note">
          <div>
            <strong>Clase de solo lectura</strong>
            <span>
              Las clases canceladas o reemplazadas por reprogramación no admiten nuevos registros.
            </span>
          </div>
        </div>
      )}
      <section className="table-surface table-wrap attendance-table">
        {attendance.length ? (
          <table>
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Restricción</th>
                <th>Asistencia</th>
                <th>Comentario de asistencia</th>
                <th>Seguimiento</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((entry) => {
                const student = data.students.find((item) => item.id === entry.studentId);
                if (!student) return null;
                return (
                  <tr key={entry.studentId}>
                    <td className="primary-cell">
                      <button className="text-button" onClick={() => onStudent(student.id)}>
                        {student.name}
                      </button>
                      <span>{entry.temporary ? "Invitado temporal" : "Asignado al grupo"}</span>
                    </td>
                    <td>
                      {student.restrictions ? (
                        <button
                          className="text-button"
                          onClick={() => setRestrictionStudentId(student.id)}
                        >
                          Restricción registrada
                        </button>
                      ) : (
                        <span className="muted">Información no registrada</span>
                      )}
                    </td>
                    <td>
                      {editable ? (
                        <select
                          aria-label={`Asistencia de ${student.name}`}
                          value={entry.status}
                          onChange={(event) =>
                            void saveStatus(entry, event.target.value as Attendance["status"])
                          }
                        >
                          {attendanceStatuses.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="badge light">{entry.status}</span>
                      )}
                    </td>
                    <td className="comment-cell">
                      <span>{entry.observation || "Sin comentario"}</span>
                      {editable && (
                        <button
                          className="text-button"
                          onClick={() => {
                            setError("");
                            setComment(entry.observation);
                            setCommentEntry(entry);
                          }}
                        >
                          {entry.observation
                            ? "Editar comentario"
                            : entry.status === "Falta justificada"
                              ? "Agregar justificación"
                              : "Agregar comentario"}
                        </button>
                      )}
                    </td>
                    <td>
                      {editable && (
                        <button
                          className="text-button"
                          onClick={() => setNoteStudentId(student.id)}
                        >
                          Agregar nota de seguimiento
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <Empty
            title="Sin participantes"
            text="Agrega alumnos a esta clase sin modificar su grupo."
          />
        )}
      </section>

      {commentEntry && commentStudent && (
        <Dialog
          title={`Comentario de asistencia · ${commentStudent.name}`}
          onClose={() => setCommentEntry(undefined)}
        >
          <form className="form-grid" onSubmit={saveComment}>
            {error && (
              <div className="full-span">
                <Notice kind="error">{error}</Notice>
              </div>
            )}
            <div className="context-note full-span">
              <div>
                <strong>
                  {group.name} · {date(current.date)} · {current.time}
                </strong>
                <span>Estado: {commentEntry.status}</span>
              </div>
            </div>
            <div className="field full-span">
              <label htmlFor="attendance-comment">Comentario de asistencia</label>
              <textarea
                id="attendance-comment"
                name="comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Ej. Justificó su ausencia por consulta médica"
              />
            </div>
            <div className="form-actions full-span">
              <button
                type="button"
                className="button secondary"
                data-dialog-close
                onClick={() => setCommentEntry(undefined)}
              >
                Cancelar
              </button>
              <button className="button" disabled={busy}>
                {busy ? "Guardando…" : "Guardar comentario"}
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {statusAction === "Cancelada" && (
        <ConfirmDialog
          title="Cancelar clase"
          confirmLabel="Cancelar clase"
          danger
          onConfirm={() => changeStatus("Cancelada")}
          onCancel={() => setStatusAction(undefined)}
        >
          {group.name} · {date(current.date)} · {current.time}. La cancelación no genera faltas y la
          clase ya no admitirá cambios de asistencia.
        </ConfirmDialog>
      )}
      {statusAction === "Reprogramada" && (
        <ConfirmDialog
          title="Reprogramar clase"
          confirmLabel="Reprogramar"
          field={{
            label: "Nueva fecha de la clase",
            type: "date",
            initial: current.date,
            help: "Se conserva el horario y los participantes de esta clase.",
          }}
          onConfirm={(newDate) => changeStatus("Reprogramada", newDate)}
          onCancel={() => setStatusAction(undefined)}
        />
      )}
      {restrictionStudent && (
        <Dialog
          title={`Restricción registrada · ${restrictionStudent.name}`}
          onClose={() => setRestrictionStudentId(undefined)}
        >
          <p className="long-text">{restrictionStudent.restrictions}</p>
          <div className="form-actions">
            <button className="button" onClick={() => setRestrictionStudentId(undefined)}>
              Cerrar
            </button>
          </div>
        </Dialog>
      )}
      {noteStudent && (
        <Dialog
          title={`Nota de seguimiento · ${noteStudent.name}`}
          onClose={() => setNoteStudentId(undefined)}
        >
          <NoteForm
            studentId={noteStudent.id}
            today={data.demoDate}
            sessionId={current.id}
            onCancel={() => setNoteStudentId(undefined)}
            onSaved={async () => {
              await reload();
              setNoteStudentId(undefined);
              setMessage("Nota de seguimiento guardada en el expediente.");
            }}
          />
        </Dialog>
      )}
      {showInvite && (
        <Dialog title={`Agregar alumno · ${group.name}`} onClose={() => setShowInvite(false)}>
          <form className="form-grid" onSubmit={invite}>
            {error && (
              <div className="full-span">
                <Notice kind="error">{error}</Notice>
              </div>
            )}
            <div className="field full-span">
              <label htmlFor="invite-student">Alumno</label>
              <select id="invite-student" name="studentId" required>
                <option value="">Selecciona un alumno</option>
                {data.students
                  .filter(
                    (student) =>
                      student.status === "Activo" &&
                      !attendance.some((entry) => entry.studentId === student.id),
                  )
                  .map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
              </select>
            </div>
            <p className="help full-span">Se agregará sólo a esta clase; su grupo no cambiará.</p>
            <div className="form-actions full-span">
              <button
                type="button"
                className="button secondary"
                data-dialog-close
                onClick={() => setShowInvite(false)}
              >
                Cancelar
              </button>
              <button className="button">Agregar alumno</button>
            </div>
          </form>
        </Dialog>
      )}
    </>
  );
}
