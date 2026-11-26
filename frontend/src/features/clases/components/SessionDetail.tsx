import { Status, type StatusTone } from "../../../shared/ui/Status";
import { ConfirmAction } from "../../../shared/ui/ConfirmAction";
import { SummaryItem, SummaryStrip } from "../../../shared/ui/SummaryStrip";
import { AddNoteButton } from "../../alumnos/components/AddNoteButton";
import { useState, type FormEvent } from "react";
import type { Attendance, Bootstrap, Session } from "../../../shared/api/contracts";
import { date } from "../../../shared/lib/format";
import { paths } from "../../../shared/lib/paths";
import { Dialog } from "../../../shared/ui/Dialog";
import { Link } from "../../../shared/ui/Link";
import { Empty, Notice, PageHeader } from "../../../shared/ui/PageHeader";
import { finishSession, inviteParticipant, updateAttendance } from "../api/clases.api";
import { sessionHours, sessionPhase } from "../model/clases.model";

// Dos estados: la asistencia es un dato para la escuela, no una calificación. "Sin registrar" es el
// punto de partida y "Falta justificada" solo aparece si una clase antigua ya la tenía.
const baseStatuses: Attendance["status"][] = ["Presente", "Ausente"];
const optionsFor = (current: Attendance["status"]): Attendance["status"][] =>
  baseStatuses.includes(current) ? baseStatuses : [current, ...baseStatuses];

// Mismo código de color que el resto del sistema (success / danger / warning).
const attendanceTone: Partial<Record<Attendance["status"], StatusTone>> = {
  "Sin registrar": "neutral",
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
  const [restrictionStudentId, setRestrictionStudentId] = useState<string>();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  // Filas que se están guardando: studentId -> estado que se está registrando.
  const [saving, setSaving] = useState<Record<string, Attendance["status"]>>({});
  // Confirmación o error junto a la fila del alumno.
  const [rowFeedback, setRowFeedback] = useState<Record<string, RowFeedback>>({});
  const [bulkBusy, setBulkBusy] = useState(false);
  const current = data.sessions.find((item) => item.id === session.id) ?? session;
  const group = data.groups.find((item) => item.id === current.groupId);
  // Una clase que ya pasó no se modifica; solo se le pueden agregar notas.
  const scheduled = current.status === "Programada";
  const phase = sessionPhase(current);
  const editable =
    scheduled &&
    (phase === "En curso" || (phase === "Programada" && current.date >= data.demoDate));

  if (!group) return <Empty title="Grupo no disponible" text="Recarga para consultar la clase." />;
  const attendance = current.attendance;
  const pendingCount = attendance.filter((entry) => entry.status === "Sin registrar").length;
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

  return (
    <>
      <PageHeader help="Registra la asistencia de esta clase. Las notas de seguimiento se guardan en el expediente de cada alumno." />
      <SummaryStrip compact className="spacer-bottom">
        <SummaryItem label="Grupo">{group.name}</SummaryItem>
        <SummaryItem label="Fecha">{date(current.date)}</SummaryItem>
        <SummaryItem label="Hora">{sessionHours(current)}</SummaryItem>
        <SummaryItem label="Estado">{phase}</SummaryItem>
        <SummaryItem label="Participantes">{attendance.length}</SummaryItem>
      </SummaryStrip>
      {error && (
        <Notice kind="error">
          {error}{" "}
          <button type="button" className="text-button" onClick={() => void reloadSession()}>
            Recargar clase
          </button>
        </Notice>
      )}
      {message && <Notice>{message}</Notice>}
      {editable && (
        <div className="toolbar">
          <button
            type="button"
            className="button success"
            aria-describedby="mark-all-help"
            disabled={bulkBusy || pendingCount === 0}
            onClick={() => void markAllPresent()}
          >
            {bulkBusy ? "Marcando…" : "Todos presentes"}
          </button>
          <p id="mark-all-help" className="help">
            {pendingCount > 0
              ? `Sólo cambia a los ${pendingCount} alumnos sin registrar. Después ajusta las excepciones.`
              : "Todos los alumnos ya tienen asistencia registrada."}
          </p>
          <div className="toolbar-end inline-actions">
            <ConfirmAction
              label="Terminar clase"
              title="Terminar clase"
              className="button secondary danger"
              onConfirm={async () => {
                await finishSession(current.id);
                await reload();
              }}
            >
              ¿Terminar la clase de {group.name}? Después ya no se podrá cambiar la asistencia; solo
              agregar notas.
            </ConfirmAction>
            <button className="button" onClick={() => setShowInvite(true)}>
              Agregar alumno
            </button>
          </div>
        </div>
      )}
      <section className="table-surface table-wrap attendance-table">
        {attendance.length ? (
          <table>
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Edad</th>
                <th>Asistencia</th>
                <th>Notas</th>
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
                      {entry.temporary && <span>Invitado temporal</span>}
                      {student.restrictions && (
                        <button
                          className="text-button"
                          onClick={() => setRestrictionStudentId(student.id)}
                        >
                          Restricción registrada
                        </button>
                      )}
                    </td>
                    <td>{student.age} años</td>
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
                            {optionsFor(entry.status).map((status) => (
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
                        <Status tone={attendanceTone[entry.status] ?? "neutral"}>
                          {entry.status}
                        </Status>
                      )}
                    </td>
                    <td>
                      {scheduled && (
                        <AddNoteButton
                          student={student}
                          today={data.demoDate}
                          sessionId={current.id}
                          reload={reload}
                        />
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
                className="button danger"
                data-dialog-close
                onClick={() => setShowInvite(false)}
              >
                Cancelar
              </button>
              <button className="button confirm">Aceptar</button>
            </div>
          </form>
        </Dialog>
      )}
    </>
  );
}
