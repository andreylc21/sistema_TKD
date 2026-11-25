import type { Exam, ExamEntry, ExamProgress } from "../../../shared/api/contracts";

export const examKindLabel = (kind: Exam["kind"]) =>
  kind === "black" ? "Examen de cinta negra" : "Examen parcial";

export const resultLabel = { pending: "Pendiente", passed: "Aprobó", failed: "No aprobó" } as const;

/** "1er Dan", "Poom 2": el grado negro al que aspira el alumno. */
export function targetLabel(progress: ExamProgress) {
  if (progress.track === "poom") return `Poom ${progress.target}`;
  const ordinal =
    progress.target === 1 ? "1er" : progress.target === 3 ? "3er" : `${progress.target}º`;
  return `${ordinal} Dan`;
}

/** Próximos exámenes primero; los ya pasados después, del más reciente al más antiguo. */
export function sortExams(exams: Exam[], today: string) {
  const upcoming = exams
    .filter((exam) => exam.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = exams
    .filter((exam) => exam.date < today)
    .sort((a, b) => b.date.localeCompare(a.date));
  return { upcoming, past };
}

/** Días de anticipación con que se paga un examen, igual que en el servidor. */
export const leadDays = (kind: Exam["kind"]) => (kind === "black" ? 30 : 14);

/** Fecha límite de pago propuesta: un mes antes del final y dos semanas antes de un parcial. */
export function defaultDeadline(kind: Exam["kind"], examDate: string) {
  const parsed = new Date(`${examDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return examDate;
  parsed.setDate(parsed.getDate() - leadDays(kind));
  return parsed.toISOString().slice(0, 10);
}

export type PaymentState = "paid" | "exception" | "partial" | "overdue" | "pending";

export const paymentStateLabel: Record<PaymentState, string> = {
  paid: "Pagado",
  exception: "Sin pago autorizado",
  partial: "Pago parcial",
  overdue: "Pago vencido",
  pending: "Pago pendiente",
};

export function paymentState(entry: ExamEntry, deadline: string, today: string): PaymentState {
  if (entry.owed <= 0) return "paid";
  if (entry.exception) return "exception";
  if (today > deadline) return "overdue";
  return entry.owed < entry.total ? "partial" : "pending";
}

/** El resultado sólo se registra con el examen pagado o con una excepción autorizada. */
export const canRecordResult = (state: PaymentState) => state === "paid" || state === "exception";
