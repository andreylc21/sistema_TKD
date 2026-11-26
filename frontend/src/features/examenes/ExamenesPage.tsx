import { useMemo, useRef, useState, type FormEvent } from "react";
import type { Bootstrap, Exam, ExamWrite } from "../../shared/api/contracts";
import { date, money } from "../../shared/lib/format";
import { goBack } from "../../shared/lib/navigation";
import { paths } from "../../shared/lib/paths";
import { DataTable } from "../../shared/ui/DataTable";
import { Dialog } from "../../shared/ui/Dialog";
import { FormScreen } from "../../shared/ui/FormScreen";
import { editButtonClass, EditLabel } from "../../shared/ui/EditButton";
import { Link } from "../../shared/ui/Link";
import { SearchInput } from "../../shared/ui/SearchInput";
import { Status } from "../../shared/ui/Status";
import { Notice, PageHeader } from "../../shared/ui/PageHeader";
import {
  createExam,
  enrollExam,
  removeExamEntry,
  setExamResult,
  updateExam,
} from "./api/examenes.api";
import {
  canEditExam,
  defaultDeadline,
  examKindLabel,
  examName,
  resultLabel,
  sortExams,
  targetLabel,
} from "./model/examenes.model";

type Props = { data: Bootstrap; reload: () => Promise<void> };

export function ExamenesPage({ data }: Props) {
  const { pending, history } = useMemo(
    () => sortExams(data.exams, data.demoDate),
    [data.exams, data.demoDate],
  );
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [query, setQuery] = useState("");
  const text = query.trim().toLocaleLowerCase("es");
  const nameOf = (id: string) => data.students.find((student) => student.id === id)?.name ?? "—";
  const matches = (exam: Exam) =>
    !text ||
    examName(exam).toLocaleLowerCase("es").includes(text) ||
    examKindLabel(exam.kind).toLocaleLowerCase("es").includes(text) ||
    exam.entries.some((entry) => nameOf(entry.studentId).toLocaleLowerCase("es").includes(text));
  const shown = (tab === "pending" ? pending : history).filter(matches);
  const ladder = data.students
    .filter((student) => student.status === "Activo" && data.examProgress[student.id])
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  return (
    <>
      <PageHeader help="Los parciales suben de cinta hasta la roja avanzada y después suman para el examen final de cinta negra, que se presenta una vez al año. Inscribir a un alumno registra su pago y ya no se devuelve. La inscripción cierra el día del examen, y Aprobó / No aprobó se habilita desde esa fecha." />
      {ladder.length > 0 && (
        <section className="card section-gap">
          <div className="card-body">
            <h2>Camino a cinta negra</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Alumno</th>
                    <th>Grado actual</th>
                    <th>Aspira a</th>
                    <th>Parciales</th>
                    <th>Tiempo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {ladder.map((student) => {
                    const progress = data.examProgress[student.id];
                    return (
                      <tr key={student.id}>
                        <td className="primary-cell">
                          <strong>{student.name}</strong>
                        </td>
                        <td>{student.grade}</td>
                        <td>{targetLabel(progress)}</td>
                        <td>
                          {progress.partials} de {progress.required}
                        </td>
                        <td>
                          {progress.months === null
                            ? "—"
                            : `${progress.months} de ${progress.minMonths} meses`}
                        </td>
                        <td>
                          <span className={`badge ${progress.ready ? "success" : "light"}`}>
                            {progress.ready ? "Listo para el final" : progress.missing.join(" · ")}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
      <div className="tabs-row">
        <div className="tabs" role="tablist" aria-label="Exámenes">
          <button
            className="tab"
            role="tab"
            aria-selected={tab === "pending"}
            onClick={() => setTab("pending")}
          >
            En curso
          </button>
          <button
            className="tab"
            role="tab"
            aria-selected={tab === "history"}
            onClick={() => setTab("history")}
          >
            Historial
          </button>
        </div>
        <Link className="button" to={paths.examenNuevo}>
          Programar examen
        </Link>
      </div>
      <div className="toolbar">
        <SearchInput
          id="exam-search"
          label="Buscar por nombre de examen o alumno"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <DataTable
        rows={shown}
        rowKey={(exam) => exam.id}
        empty={{
          title: text
            ? "Sin coincidencias"
            : tab === "pending"
              ? "Sin exámenes en curso"
              : "Sin historial todavía",
          text:
            tab === "pending"
              ? "Programa un parcial o el examen de cinta negra para inscribir alumnos."
              : "Aquí aparecen los exámenes que ya se realizaron y tienen todos sus resultados.",
        }}
        columns={[
          {
            header: "Examen",
            primary: true,
            cell: (exam) => (
              <>
                <Link className="row-link" to={paths.examen(exam.id)}>
                  <strong>{examName(exam)}</strong>
                </Link>
                {exam.name.trim() && <span>{examKindLabel(exam.kind)}</span>}
              </>
            ),
          },
          { header: "Fecha", cell: (exam) => date(exam.date) },
          { header: "Costo", cell: (exam) => money(exam.fee) },
          { header: "Inscritos", cell: (exam) => exam.entries.length },
          ...(tab === "history"
            ? [
                {
                  header: "Resultados",
                  cell: (exam: Exam) => {
                    const passed = exam.entries.filter((e) => e.result === "passed").length;
                    return `${passed} aprobaron · ${exam.entries.length - passed} no`;
                  },
                },
              ]
            : []),
          {
            header: "Acciones",
            actions: true,
            cell: (exam) => (
              <>
                {data.demoDate < exam.date && (
                  <Link className="button small" to={paths.examen(exam.id, true)}>
                    Inscribir alumno
                  </Link>
                )}
                {canEditExam(exam) && (
                  <Link className={editButtonClass} to={paths.examenEditar(exam.id)}>
                    <EditLabel />
                  </Link>
                )}
              </>
            ),
          },
        ]}
      />
    </>
  );
}

export function ExamDetailPage({
  data,
  exam,
  reload,
  enroll = false,
}: Props & { exam: Exam; enroll?: boolean }) {
  const nameOf = (id: string) => data.students.find((student) => student.id === id)?.name ?? "—";
  return (
    <>
      <PageHeader help="Aquí ves los inscritos del examen. Aprobó / No aprobó se habilita desde la fecha del examen." />
      <ExamCard
        exam={exam}
        data={data}
        nameOf={nameOf}
        query=""
        reload={reload}
        startEnrolling={enroll}
      />
    </>
  );
}

function ExamCard({
  exam,
  data,
  nameOf,
  query,
  reload,
  startEnrolling = false,
}: {
  exam: Exam;
  data: Bootstrap;
  nameOf: (id: string) => string;
  query: string;
  reload: () => Promise<void>;
  startEnrolling?: boolean;
}) {
  const [studentId, setStudentId] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Con búsqueda activa se muestran sólo los alumnos que coinciden, si hay alguno.
  const found = exam.entries.filter((entry) =>
    nameOf(entry.studentId).toLocaleLowerCase("es").includes(query),
  );
  const rows = query && found.length ? found : exam.entries;
  const enrolled = new Set(exam.entries.map((entry) => entry.studentId));
  const candidates = data.students
    .filter(
      (student) =>
        student.status === "Activo" &&
        !enrolled.has(student.id) &&
        (exam.kind === "partial" || data.examProgress[student.id]),
    )
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  const progress = studentId ? data.examProgress[studentId] : undefined;
  const [method, setMethod] = useState("Efectivo");
  const [enrolling, setEnrolling] = useState(startEnrolling);
  const open = data.demoDate < exam.date;
  const started = data.demoDate >= exam.date;
  const lacksRequirements = exam.kind === "black" && progress && !progress.ready;
  const needsReason = Boolean(studentId) && Boolean(lacksRequirements);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await action();
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo completar la operación.");
    } finally {
      setBusy(false);
    }
  }

  async function enroll(event: FormEvent) {
    event.preventDefault();
    if (!studentId) return;
    await run(async () => {
      await enrollExam(exam.id, {
        studentId,
        reason: reason.trim() || undefined,
        method: exam.fee > 0 ? (method as "Efectivo") : undefined,
      });
      setStudentId("");
      setReason("");
      setEnrolling(false);
    });
  }

  return (
    <section className="card section-gap">
      <div className="card-body">
        <div className="card-title-row">
          <h3 className="exam-title">{examName(exam)}</h3>
          <dl className="exam-facts">
            <div>
              <dt>Fecha</dt>
              <dd>{date(exam.date)}</dd>
            </div>
            <div>
              <dt>Costo</dt>
              <dd>{money(exam.fee)}</dd>
            </div>
            <div>
              <dt>Inscritos</dt>
              <dd>{exam.entries.length}</dd>
            </div>
          </dl>
          <div className="inline-actions">
            {open && (
              <button className="button small" onClick={() => setEnrolling(true)}>
                Inscribir alumno
              </button>
            )}
            {canEditExam(exam) && (
              <Link className={editButtonClass} to={paths.examenEditar(exam.id)}>
                <EditLabel />
              </Link>
            )}
          </div>
        </div>
        {error && <Notice kind="error">{error}</Notice>}
        {exam.entries.length > 0 && (
          <div className="table-wrap">
            <table className="fixed-table">
              <colgroup>
                <col style={{ width: "34%" }} />
                <col style={{ width: "26%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "20%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Alumno</th>
                  <th>Grado</th>
                  <th>Resultado</th>
                  <th>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((entry) => (
                  <tr key={entry.id}>
                    <td className="primary-cell">
                      <strong>{nameOf(entry.studentId)}</strong>
                      {entry.reason && <span>Motivo: {entry.reason}</span>}
                    </td>
                    <td>
                      {entry.gradeTo ? `${entry.gradeFrom} → ${entry.gradeTo}` : entry.gradeFrom}
                    </td>
                    <td>
                      <Status
                        tone={
                          entry.result === "passed"
                            ? "success"
                            : entry.result === "failed"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {resultLabel[entry.result]}
                      </Status>
                    </td>
                    <td>
                      {entry.result === "pending" && (
                        <div className="inline-actions">
                          {started ? (
                            <>
                              <button
                                className="button small"
                                disabled={busy}
                                onClick={() =>
                                  run(() => setExamResult(exam.id, entry.id, { result: "passed" }))
                                }
                              >
                                Aprobó
                              </button>
                              <button
                                className="button secondary small"
                                disabled={busy}
                                onClick={() =>
                                  run(() => setExamResult(exam.id, entry.id, { result: "failed" }))
                                }
                              >
                                No aprobó
                              </button>
                            </>
                          ) : (
                            entry.owed >= entry.total && (
                              <button
                                className="button secondary small"
                                disabled={busy}
                                onClick={() => run(() => removeExamEntry(exam.id, entry.id))}
                              >
                                Quitar
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {open && enrolling && (
          <Dialog title="Inscribir alumno" onClose={() => setEnrolling(false)}>
            <form className="form-grid enroll-form" onSubmit={enroll}>
              {error && (
                <div className="full-span">
                  <Notice kind="error">{error}</Notice>
                </div>
              )}
              <div className={`field${exam.fee > 0 ? "" : " full-span"}`}>
                <label htmlFor={`enroll-${exam.id}`}>Alumno</label>
                <select
                  id={`enroll-${exam.id}`}
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                >
                  <option value="">Selecciona un alumno</option>
                  {candidates.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
                {needsReason && (
                  <span className="field-hint">
                    Aún no cumple los requisitos ({progress?.missing.join(", ")}). Puedes
                    inscribirlo escribiendo el motivo.
                  </span>
                )}
              </div>
              {exam.fee > 0 && (
                <div className="field">
                  <label htmlFor={`method-${exam.id}`}>Forma de pago</label>
                  <select
                    id={`method-${exam.id}`}
                    value={method}
                    onChange={(event) => setMethod(event.target.value)}
                  >
                    <option>Efectivo</option>
                    <option>Transferencia</option>
                    <option>Tarjeta</option>
                    <option>Otro</option>
                  </select>
                </div>
              )}
              {needsReason && (
                <div className="field full-span">
                  <label htmlFor={`reason-${exam.id}`}>Motivo</label>
                  <input
                    id={`reason-${exam.id}`}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Ej. Falta de asistencia"
                  />
                </div>
              )}
              {exam.fee > 0 ? (
                <div className="enroll-total">
                  <span>Total a cobrar</span>
                  <strong>{money(exam.fee)}</strong>
                </div>
              ) : (
                <span />
              )}
              <div className="form-actions">
                <button
                  type="button"
                  className="button danger"
                  data-dialog-close
                  onClick={() => setEnrolling(false)}
                >
                  Cancelar
                </button>
                <button
                  className="button confirm"
                  disabled={busy || !studentId || (needsReason && !reason.trim())}
                >
                  Aceptar
                </button>
              </div>
            </form>
          </Dialog>
        )}
        {!open && <p className="muted">La inscripción cerró: el examen es hoy o ya pasó.</p>}
      </div>
    </section>
  );
}

export function ExamFormPage(props: Props) {
  return <ExamForm {...props} />;
}

export function ExamEditPage(props: Props & { exam: Exam }) {
  return <ExamForm {...props} />;
}

function ExamForm({ data, reload, exam }: Props & { exam?: Exam }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const idempotencyKey = useRef(crypto.randomUUID());
  const [kind, setKind] = useState<ExamWrite["kind"]>(exam?.kind ?? "partial");
  const [nameValue, setNameValue] = useState(exam?.name ?? "");
  const [examDate, setExamDate] = useState(exam?.date ?? data.demoDate);
  // El plazo ya no se pide: se guarda una semana antes del examen.
  const deadline = defaultDeadline(examDate);
  const hasPayments = Boolean(exam?.entries.some((entry) => entry.owed < entry.total));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const fee = String(values.fee);
    setBusy(true);
    setError("");
    try {
      if (exam) {
        await updateExam(exam.id, {
          kind,
          name: nameValue.trim(),
          date: examDate,
          fee,
          paymentDeadline: deadline,
        });
      } else {
        await createExam(
          { kind, name: nameValue.trim(), date: examDate, fee, paymentDeadline: deadline },
          idempotencyKey.current,
        );
      }
      await reload();
      goBack(paths.examenes, {
        notice: exam ? "Examen actualizado." : "Examen programado.",
        force: true,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar el examen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        help={
          exam
            ? "Cambia el nombre, el tipo, la fecha o el costo. Si cambias la fecha, los cobros de los alumnos inscritos se ajustan solos. El costo ya no se puede cambiar cuando hay pagos registrados; si te equivocaste, anula primero esos pagos en Pagos. Si dejas el nombre vacío se usa Examen + tipo + fecha."
            : "Elige si es un parcial o el examen anual de cinta negra, la fecha y el costo. Al inscribir a un alumno se registra su pago; la inscripción cierra el día del examen. Si dejas el nombre vacío se usa Examen + tipo + fecha."
        }
      />
      <FormScreen title="Datos del examen">
        <form className="form-grid" onSubmit={submit}>
          {error && (
            <div className="full-span">
              <Notice kind="error">{error}</Notice>
            </div>
          )}
          <div className="field full-span">
            <label htmlFor="exam-kind">Tipo de examen</label>
            <select
              id="exam-kind"
              value={kind}
              onChange={(event) => setKind(event.target.value as ExamWrite["kind"])}
            >
              <option value="partial">Parcial</option>
              <option value="black">Cinta negra</option>
            </select>
          </div>
          <div className="field full-span">
            <label htmlFor="exam-name">
              Nombre <span>(opcional)</span>
            </label>
            <input
              id="exam-name"
              value={nameValue}
              maxLength={80}
              onChange={(event) => setNameValue(event.target.value)}
              placeholder="Ej. Parcial de octubre"
            />
          </div>
          <div className="field">
            <label htmlFor="exam-date">Fecha</label>
            <input
              id="exam-date"
              type="date"
              value={examDate}
              onChange={(event) => setExamDate(event.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="exam-fee">Costo</label>
            <input
              id="exam-fee"
              name="fee"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              defaultValue={exam ? String(exam.fee) : String(data.school.examFee)}
              readOnly={hasPayments}
              required
            />
          </div>
          <div className="form-actions full-span">
            <button type="button" className="button danger" onClick={() => goBack(paths.examenes)}>
              Cancelar
            </button>
            <button className="button confirm" disabled={busy}>
              Aceptar
            </button>
          </div>
        </form>
      </FormScreen>
    </>
  );
}
