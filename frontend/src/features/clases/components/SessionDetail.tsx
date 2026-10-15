import { useState, type FormEvent } from "react";
import type { Attendance, Bootstrap, Session } from "../../../shared/api/contracts";
import { date } from "../../../shared/lib/format";
import { paths } from "../../../shared/lib/paths";
import { ConfirmDialog } from "../../../shared/ui/ConfirmDialog";
import { Dialog } from "../../../shared/ui/Dialog";
import { Link } from "../../../shared/ui/Link";
import { Empty, Notice, PageHeader } from "../../../shared/ui/PageHeader";
import { inviteParticipant, updateAttendance, updateSessionStatus } from "../api/clases.api";

const attendanceStatuses: Attendance["status"][] = [
  "Sin registrar",
  "Presente",
  "Ausente",
  "Falta justificada",
];

// Mismo código de color que el resto del sistema (success / danger / warning).
const attendanceTone: Partial<Record<Attendance["status"], string>> = {
  "Sin registrar": "light",
  Presente: "success",
  Ausente: "danger",
  "Falta justificada": "warning",
};

type RowFeedback = { kind: "ok" | "error"; text: string };

export function SessionDetail({
  data,
  session,
  reload,
}: {
  data: Bootstrap;
  session: Session;
  reload: () => Promise<void>;
}) {
  const [showInvite, setShowInvite] = useState(false);
  const [commentEntry, setCommentEntry] = useState<Attendance>();
  const [restrictionStudentId, setRestrictionStudentId] = useState<string>();
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [statusAction, setStatusAction] = useState<"Cancelada" | "Reprogramada">();
  // Filas que se están guardando: studentId -> estado que se está registrando.
  const [saving, setSaving] = useState<Record<string, Attendance["status"]>>({});
  // Confirmación o error junto a la fila del alumno.
  const [rowFeedback, setRowFeedback] = useState<Record<string, RowFeedback>>({});
  const [bulkBusy, setBulkBusy] = useState(false);
  const current = data.sessions.find((item) => item.id === session.id) ?? session;
  const group = data.groups.find((item) => item.id === current.groupId);
  const editable = current.status === "Programada";

  if (!group) return <Empty title="Grupo no disponible" text="Recarga para consultar la clase." />;
  const attendance = current.attendance;
  const pendingCount = attendance.filter((entry) => entry.status === "Sin registrar").length;
  const absences = attendance.filter(
    (entry) => entry.status === "Ausente" || entry.status === "Falta justificada",
  ).length;
  const commentStudent = commentEntry
    ? data.students.find((item) => item.id === commentEntry.studentId)
    : undefined;
  const restrictionStudent = data.students.find((item) => item.id === restrictionStudentId);

  function markSaving(ids: string[], status?: Attendance["status"]) {
    setSaving((previous) => {
      const next = { ...previous };
      for (const id of ids) {
        if (status) next[id] = status;
        else delete next[id];
      }
      return next;
    });
  }

  function setFeedback(id: string, value?: RowFeedback) {
    setRowFeedback((previous) => {
      const next = { ...previous };
      if (value) next[id] = value;
      else delete next[id];
      return next;
    });
  }

  async function saveStatus(entry: Attendance, studentName: string, status: Attendance["status"]) {
    const id = entry.studentId;
    if (id in saving || bulkBusy) return;
    setError("");
    setMessage("");
    setFeedback(id);
    markSaving([id], status);
    try {
      await updateAttendance(current.id, id, {
        status,
        observation: entry.observation,
        version: entry.version,
      });
      await reload();
      setFeedback(id, { kind: "ok", text: `${studentName}: ${status}.` });
      window.setTimeout(() => {
        setRowFeedback((previous) => {
          if (previous[id]?.kind !== "ok") return previous;
          const next = { ...previous };
          delete next[id];
          return next;
        });
      }, 4000);
    } catch (caught) {
      setFeedback(id, {
        kind: "error",
        text: caught instanceof Error ? caught.message : "No se pudo guardar la asistencia.",
      });
    } finally {
      markSaving([id]);
    }
  }

  // Marca como presentes sólo a quienes siguen "Sin registrar"; no pisa Ausente ni Falta justificada.
  async function markAllPresent() {
    const pending = attendance.filter((entry) => entry.status === "Sin registrar");
    if (!pending.length || bulkBusy) return;
    const ids = pending.map((entry) => entry.studentId);
    setBulkBusy(true);
    setError("");
    setMessage("");
    setRowFeedback({});
    markSaving(ids, "Presente");
    let failed = 0;
    for (const entry of pending) {
      try {
        await updateAttendance(current.id, entry.studentId, {
          status: "Presente",
          observation: entry.observation,
          version: entry.version,
        });
      } catch (caught) {
        failed += 1;
        setFeedback(entry.studentId, {
          kind: "error",
          text: caught instanceof Error ? caught.message : "No se pudo guardar la asistencia.",
        });
      }
    }
    try {
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo actualizar la clase.");
    } finally {
      markSaving(ids);
      setBulkBusy(false);
    }
    const saved = pending.length - failed;
    if (saved) {
      setMessage(
        `${saved} ${saved === 1 ? "alumno marcado como presente" : "alumnos marcados como presentes"}. Ajusta las excepciones en la tabla.`,
      );
    }
    if (failed) {
      setError(
        `No se pudo registrar a ${failed} ${failed === 1 ? "alumno" : "alumnos"}. Revisa las filas con error.`,
      );
    }
  }

  async function reloadSession() {
    setError("");
    setRowFeedback({});
    try {
      await reload();
      setMessage("Clase recargada con los datos más recientes.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo recargar la clase.");
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
        ? absences
          ? `Clase cancelada. Las ${absences} ${absences === 1 ? "falta ya registrada se conserva" : "faltas ya registradas se conservan"}; la cancelación no agregó faltas nuevas.`
          : "Clase cancelada; no generó faltas."
        : `Clase reprogramada para el ${date(newDate)}.`,
    );
  }

  return (
    <>
      <PageHeader
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
      {error && !commentEntry && (
        <Notice kind="error">
          {error}{" "}
          <button type="button" className="text-button" onClick={() => void reloadSession()}>
            Recargar clase
          </button>
        </Notice>
      )}
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
      {editable && pendingCount > 0 && (
        <div className="toolbar">
          <button
            type="button"
            className="button secondary"
            aria-describedby="mark-all-help"
            disabled={bulkBusy}
            onClick={() => void markAllPresent()}
          >
            {bulkBusy ? "Marcando…" : "Marcar todos como presentes"}
          </button>
          <p id="mark-all-help" className="help">
            Sólo cambia a los {pendingCount} alumnos sin registrar. Después ajusta las excepciones.
          </p>
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
                const isSaving = entry.studentId in saving;
                const feedback = rowFeedback[entry.studentId];
                return (
                  <tr key={entry.studentId}>
                    <td className="primary-cell">
                      <Link className="text-button" to={paths.alumno(student.id)}>
                        {student.name}
                      </Link>
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
                        <div className="attendance-control">
                          <select
                            aria-label={`Asistencia de ${student.name}`}
                            aria-busy={isSaving}
                            value={saving[entry.studentId] ?? entry.status}
                            disabled={isSaving || bulkBusy}
                            onChange={(event) =>
                              void saveStatus(
                                entry,
                                student.name,
                                event.target.value as Attendance["status"],
                              )
                            }
                          >
                            {attendanceStatuses.map((status) => (
                              <option key={status}>{status}</option>
                            ))}
                          </select>
                          {isSaving && (
                            <span className="row-feedback muted" role="status">
                              Guardando…
                            </span>
                          )}
                          {!isSaving && feedback?.kind === "ok" && (
                            <span className="row-feedback ok" role="status">
                              <span aria-hidden="true">✓ Guardado</span>
                              <span className="sr-only">{feedback.text}</span>
                            </span>
                          )}
                          {!isSaving && feedback?.kind === "error" && (
                            <span className="row-feedback error" role="alert">
                              {feedback.text}{" "}
                              <button
                                type="button"
                                className="text-button"
                                onClick={() => void reloadSession()}
                              >
                                Recargar clase
                              </button>
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className={`badge ${attendanceTone[entry.status] ?? "light"}`}>
                          {entry.status}
                        </span>
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
                        <Link className="text-button" to={paths.sesionNota(current.id, student.id)}>
                          Agregar nota de seguimiento
                        </Link>
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
          {group.name} · {date(current.date)} · {current.time}.{" "}
          {absences
            ? `Ya hay ${absences} ${absences === 1 ? "falta registrada" : "faltas registradas"}: se conservan, y la cancelación no agrega faltas nuevas.`
            : "La cancelación no genera faltas."}{" "}
          La clase ya no admitirá cambios de asistencia.
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