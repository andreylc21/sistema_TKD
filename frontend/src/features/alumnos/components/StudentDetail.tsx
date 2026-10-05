import type { Bootstrap, Student } from "../../../shared/api/contracts";
import { paidFor } from "../../../shared/lib/format";
import { paths } from "../../../shared/lib/paths";
import { Link } from "../../../shared/ui/Link";
import { Money } from "../../../shared/ui/Money";
import { Empty, PageHeader } from "../../../shared/ui/PageHeader";
import { studentNotes } from "../model/alumnos.model";
import { NoteList } from "./NoteList";

const previewNotes = 3;

export function StudentDetail({
  data,
  student,
  reload,
  onChangeStatus,
}: {
  data: Bootstrap;
  student: Student;
  reload: () => Promise<void>;
  onChangeStatus: () => void;
}) {
  const notes = studentNotes(data.notes, student.id);
  const balance = data.charges
    .filter((charge) => charge.studentId === student.id)
    .reduce((sum, charge) => sum + charge.total - paidFor(charge.id, data.payments), 0);

  return (
    <>
      <PageHeader
        context={`${student.age} años · ${student.grade}`}
        actions={
          <>
            <span className={`badge ${student.status === "Activo" ? "success" : "light"}`}>
              {student.status}
            </span>
            <Link className="button secondary" to={paths.alumnoEditar(student.id)}>
              Editar expediente
            </Link>
            <Link className="button secondary" to={paths.notaNueva(student.id)}>
              Agregar nota
            </Link>
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
            <div>
              <h2>Notas de seguimiento</h2>
              {notes.length > previewNotes && (
                <p>
                  Las {previewNotes} más recientes de {notes.length}.
                </p>
              )}
            </div>
            {notes.length > 0 && (
              <Link className="text-button" to={paths.notas(student.id)}>
                Ver todas ({notes.length})
              </Link>
            )}
          </div>
          {notes.length ? (
            <NoteList
              data={data}
              student={student}
              notes={notes.slice(0, previewNotes)}
              reload={reload}
              preview
            />
          ) : (
            <Empty title="Sin notas" text="Todavía no hay notas de seguimiento." />
          )}
        </section>
        <section className="card">
          <div className="card-header">
            <h2>Resumen financiero</h2>
          </div>
          <div className="card-body">
            <strong className="metric-value">
              <Money value={balance} />
            </strong>
            <p className="muted">Saldo pendiente en todos sus conceptos.</p>
          </div>
        </section>
      </div>
    </>
  );
}
