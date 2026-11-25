import { useMemo, useRef, useState, type FormEvent } from "react";
import type { Bootstrap, Exam, ExamWrite } from "../../shared/api/contracts";
import { date, money } from "../../shared/lib/format";
import { goBack } from "../../shared/lib/navigation";
import { paths } from "../../shared/lib/paths";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { FormScreen } from "../../shared/ui/FormScreen";
import { Link } from "../../shared/ui/Link";
import { Empty, Notice, PageHeader } from "../../shared/ui/PageHeader";
import {
  authorizeExamPayment,
  createExam,
  enrollExam,
  removeExamEntry,
  setExamResult,
} from "./api/examenes.api";
import {
  canRecordResult,
  defaultDeadline,
  examKindLabel,
  paymentState,
  paymentStateLabel,
  resultLabel,
  sortExams,
  targetLabel,
  type PaymentState,
} from "./model/examenes.model";

type Props = { data: Bootstrap; reload: () => Promise<void> };

export function ExamenesPage({ data, reload }: Props) {
  const { upcoming, past } = useMemo(
    () => sortExams(data.exams, data.demoDate),
    [data.exams, data.demoDate],
  );
  const nameOf = (id: string) => data.students.find((student) => student.id === id)?.name ?? "—";
  const ladder = data.students
    .filter((student) => student.status === "Activo" && data.examProgress[student.id])
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  return (
    <>
      <PageHeader
        help="Los parciales suben de cinta hasta la roja avanzada y después suman para el examen final de cinta negra, que se presenta una vez al año. Todo examen genera un cobro en Pagos."
        actions={
          <Link className="button" to={paths.examenNuevo}>
            Programar examen
          </Link>
        }
      />
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
      <h2 className="section-title">Próximos exámenes</h2>
      {upcoming.length ? (
        upcoming.map((exam) => (
          <ExamCard key={exam.id} exam={exam} data={data} nameOf={nameOf} reload={reload} />
        ))
      ) : (
        <section className="card">
          <Empty
            title="Sin exámenes programados"
            text="Programa un parcial o el examen de cinta negra para inscribir alumnos."
          />
        </section>
      )}
      {past.length > 0 && (
        <>
          <h2 className="section-title">Exámenes anteriores</h2>
          {past.map((exam) => (
            <ExamCard key={exam.id} exam={exam} data={data} nameOf={nameOf} reload={reload} />
          ))}
        </>
      )}
    </>
  );
}

function ExamCard({
  exam,
  data,
  nameOf,
  reload,
}: {
  exam: Exam;
  data: Bootstrap;
  nameOf: (id: string) => string;
  reload: () => Promise<void>;
}) {
  const [studentId, setStudentId] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
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
  const [excepting, setExcepting] = useState<string | null>(null);
  const late = data.demoDate > exam.paymentDeadline;
  const lacksRequirements = exam.kind === "black" && progress && !progress.ready;
  const needsReason = Boolean(studentId) && (late || lacksRequirements);

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
      await enrollExam(exam.id, { studentId, reason: reason.trim() || undefined });
      setStudentId("");
      setReason("");
    });
  }

  return (
    <section className="card section-gap">
      <div className="card-body">
        <h3>
          {examKindLabel(exam.kind)} · {date(exam.date)}
        </h3>
        <p className="muted">
          Costo por alumno: {money(exam.fee)} · Pago a más tardar el {date(exam.paymentDeadline)} ·{" "}
          {exam.entries.length} {exam.entries.length === 1 ? "inscrito" : "inscritos"}
        </p>
        {error && <Notice kind="error">{error}</Notice>}
        {exam.entries.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Alumno</th>
                  <th>Grado</th>
                  <th>Pago</th>
                  <th>Resultado</th>
                  <th>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {exam.entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="primary-cell">
                      <strong>{nameOf(entry.studentId)}</strong>
                      {entry.reason && <span>Motivo de la excepción: {entry.reason}</span>}
                    </td>
                    <td>
                      {entry.gradeTo ? `${entry.gradeFrom} → ${entry.gradeTo}` : entry.gradeFrom}
                    </td>
                    <td>
                      <PaymentBadge
                        state={paymentState(entry, exam.paymentDeadline, data.demoDate)}
                      />
                    </td>
                    <td>
                      <span
                        className={`badge ${entry.result === "passed" ? "success" : entry.result === "failed" ? "danger" : "light"}`}
                      >
                        {resultLabel[entry.result]}
                      </span>
                    </td>
                    <td>
                      {entry.result === "pending" && (
                        <div className="inline-actions">
                          {canRecordResult(
                            paymentState(entry, exam.paymentDeadline, data.demoDate),
                          ) ? (
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
                            <>
                              <Link className="button small" to={paths.pagoNuevo(entry.chargeId)}>
                                Registrar pago
                              </Link>
                              <button
                                className="button secondary small"
                                disabled={busy}
                                onClick={() => setExcepting(entry.id)}
                              >
                                Autorizar sin pago
                              </button>
                            </>
                          )}
                          <button
                            className="button secondary small"
                            disabled={busy}
                            onClick={() => run(() => removeExamEntry(exam.id, entry.id))}
                          >
                            Quitar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <form className="list-tools" onSubmit={enroll}>
          <div className="field grow">
            <label htmlFor={`enroll-${exam.id}`}>Inscribir alumno</label>
            <select
              id={`enroll-${exam.id}`}
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
            >
              <option value="">Selecciona un alumno</option>
              {candidates.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} · {student.grade}
                </option>
              ))}
            </select>
            {needsReason && (
              <span className="field-hint">
                {[
                  late && "El plazo de pago de este examen ya venció.",
                  lacksRequirements &&
                    `Aún no cumple los requisitos (${progress.missing.join(", ")}).`,
                ]
                  .filter(Boolean)
                  .join(" ")}{" "}
                Puedes inscribirlo escribiendo el motivo.
              </span>
            )}
          </div>
          {needsReason && (
            <div className="field grow">
              <label htmlFor={`reason-${exam.id}`}>Motivo</label>
              <input
                id={`reason-${exam.id}`}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </div>
          )}
          <button
            className="button"
            disabled={busy || !studentId || (needsReason && !reason.trim())}
          >
            Inscribir
          </button>
        </form>
        {excepting && (
          <ConfirmDialog
            title="Autorizar sin pago"
            confirmLabel="Autorizar"
            field={{
              label: "Motivo de la excepción",
              help: "El cobro sigue pendiente en Pagos. Queda registrado quién asume el pago.",
            }}
            onConfirm={async (value) => {
              await authorizeExamPayment(exam.id, excepting, { reason: value });
              setExcepting(null);
              await reload();
            }}
            onCancel={() => setExcepting(null)}
          >
            {nameOf(exam.entries.find((entry) => entry.id === excepting)?.studentId ?? "")}
          </ConfirmDialog>
        )}
      </div>
    </section>
  );
}

function PaymentBadge({ state }: { state: PaymentState }) {
  const kind = state === "paid" ? "success" : state === "overdue" ? "danger" : "warning";
  return <span className={`badge ${kind}`}>{paymentStateLabel[state]}</span>;
}

export function ExamFormPage({ data, reload }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const idempotencyKey = useRef(crypto.randomUUID());
  const [kind, setKind] = useState<ExamWrite["kind"]>("partial");
  const [examDate, setExamDate] = useState(data.demoDate);
  const [pickedDeadline, setPickedDeadline] = useState("");
  // Mientras no se elija una fecha a mano, el plazo sigue al tipo y a la fecha del examen.
  const deadline = pickedDeadline || defaultDeadline(kind, examDate);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const body: ExamWrite = {
      kind,
      date: examDate,
      fee: String(values.fee),
      paymentDeadline: deadline,
    };
    setBusy(true);
    setError("");
    try {
      await createExam(body, idempotencyKey.current);
      await reload();
      goBack(paths.examenes, { notice: "Examen programado.", force: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo programar el examen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader help="Elige si es un parcial o el examen anual de cinta negra, la fecha y el costo por alumno. Después inscribes a los alumnos y se genera su cobro." />
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
            <label htmlFor="exam-fee">Costo por alumno</label>
            <input
              id="exam-fee"
              name="fee"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              defaultValue="0"
              required
            />
          </div>
          <div className="field full-span">
            <label htmlFor="exam-deadline">Fecha límite de pago</label>
            <input
              id="exam-deadline"
              type="date"
              value={deadline}
              max={examDate}
              onChange={(event) => setPickedDeadline(event.target.value)}
              required
            />
            <span className="field-hint">
              Por defecto, {kind === "black" ? "un mes" : "dos semanas"} antes del examen. Después
              de esta fecha, inscribir a un alumno sin pagar requiere una excepción.
            </span>
          </div>
          <div className="form-actions full-span">
            <button
              type="button"
              className="button secondary"
              onClick={() => goBack(paths.examenes)}
            >
              Cancelar
            </button>
            <button className="button" disabled={busy}>
              Programar examen
            </button>
          </div>
        </form>
      </FormScreen>
    </>
  );
}
