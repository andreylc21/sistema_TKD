import type { Exam, ExamProgress } from "../../../shared/api/contracts";

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

/** Un examen sigue pendiente mientras no pase su fecha o le falte registrar algún resultado. */
export const isPendingExam = (exam: Exam, today: string) =>
  exam.date >= today || exam.entries.some((entry) => entry.result === "pending");

/** Con algún resultado registrado el examen ya no se puede reprogramar. */
export const canEditExam = (exam: Exam) =>
  exam.entries.every((entry) => entry.result === "pending");

/** Pendientes: el más próximo primero. Historial: del más reciente al más antiguo. */
export function sortExams(exams: Exam[], today: string) {
  const pending = exams
    .filter((exam) => isPendingExam(exam, today))
    .sort((a, b) => a.date.localeCompare(b.date));
  const history = exams
    .filter((exam) => !isPendingExam(exam, today))
    .sort((a, b) => b.date.localeCompare(a.date));
  return { pending, history };
}

/** Exámenes en que se inscribió un alumno, del más reciente al más antiguo. */
export function studentExams(exams: Exam[], studentId: string) {
  return exams
    .flatMap((exam) =>
      exam.entries
        .filter((entry) => entry.studentId === studentId)
        .map((entry) => ({ exam, entry })),
    )
    .sort((a, b) => b.exam.date.localeCompare(a.exam.date));
}

/** Días de anticipación con que se paga un examen, igual que en el servidor. */
export const leadDays = 7;

/** Fecha límite de pago propuesta: una semana antes del examen. */
export function defaultDeadline(examDate: string) {
  const parsed = new Date(`${examDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return examDate;
  parsed.setDate(parsed.getDate() - leadDays);
  return parsed.toISOString().slice(0, 10);
}
