import type { Bootstrap, Note, Student } from "../../../shared/api/contracts";
import { date, money, paidFor } from "../../../shared/lib/format";
import { Empty, PageHeader } from "../../../shared/ui/PageHeader";

export function StudentDetail({
  data,
  student,
  onBack,
  onEdit,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onChangeStatus,
}: {
  data: Bootstrap;
  student: Student;
  onBack: () => void;
  onEdit: () => void;
  onAddNote: () => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (note: Note) => void;
  onChangeStatus: () => void;
}) {
  const notes = data.notes.filter((note) => note.studentId === student.id);
  const balance = data.charges
    .filter((charge) => charge.studentId === student.id)
    .reduce((sum, charge) => sum + charge.total - paidFor(charge.id, data.payments), 0);

  return (
    <>
      <button className="text-button detail-back" onClick={onBack}>
        ← Volver a alumnos
      </button>
      <PageHeader
        title={student.name}
        context={`${student.age} años · ${student.grade}`}
        actions={
          <>
            <span className={`badge ${student.status === "Activo" ? "success" : "light"}`}>
              {student.status}
            </span>
            <button className="button secondary" onClick={onEdit}>
              Editar expediente
            </button>
            <button className="button secondary" onClick={onAddNote}>
              Agregar nota
            </button>
            <button
              className={`button secondary ${student.status === "Activo" ? "danger" : ""}`}
              onClick={onChangeStatus}
            >
              {student.status === "Activo" ? "Desactivar" : "Reactivar"}
            </button>
          </>
        }
      />
      <div className="grid cols-2">
        <section className="card">
          <div className="card-header">
            <h2>Contactos</h2>
          </div>
          <div className="card-body">
            <dl className="stack">
              <div>
                <dt className="muted">Principal</dt>
                <dd>{student.primary}</dd>
              </div>
              <div>
                <dt className="muted">Emergencia</dt>
                <dd>{student.emergency}</dd>
              </div>
              <div>
                <dt className="muted">Correo</dt>
                <dd>{student.email || "No registrado"}</dd>
              </div>
            </dl>
          </div>
        </section>
        <section className="card">
          <div className="card-header">
            <h2>Restricciones relevantes</h2>
          </div>
          <div className="card-body">
            <div className="callout">
              <strong>Indicación vigente</strong>
              <span>{student.restrictions || "No se capturó información de salud."}</span>
            </div>
          </div>
        </section>
      </div>
      <div className="grid cols-2 spacer-top">
        <section className="card">
          <div className="card-header">
            <h2>Notas de seguimiento</h2>
          </div>
          {notes.length ? (
            <ul className="list">
              {notes.map((note) => (
                <li className="list-row" key={note.id}>
                  <div className="list-row-main">
                    <strong>{note.topic}</strong>
                    <span>{note.text}</span>
                    {note.sessionId && (
                      <span className="note-origin">
                        {(() => {
                          const session = data.sessions.find((item) => item.id === note.sessionId);
                          const group = data.groups.find((item) => item.id === session?.groupId);
                          return session
                            ? `Clase: ${group?.name ?? "Grupo"} · ${date(session.date)}`
                            : "Creada desde una clase";
                        })()}
                      </span>
                    )}
                  </div>
                  <div className="list-row-value">
                    <span>{date(note.date)}</span>
                    <div className="inline-actions">
                      <button className="text-button" onClick={() => onEditNote(note)}>
                        Editar
                      </button>
                      <button className="text-button danger" onClick={() => onDeleteNote(note)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="Sin notas" text="Todavía no hay notas de seguimiento." />
          )}
        </section>
        <section className="card">
          <div className="card-header">
            <h2>Resumen financiero</h2>
          </div>
          <div className="card-body">
            <strong className="metric-value">{money(balance)}</strong>
            <p className="muted">Saldo pendiente en todos sus conceptos.</p>
          </div>
        </section>
      </div>
    </>
  );
}
