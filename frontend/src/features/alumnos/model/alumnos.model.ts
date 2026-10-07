import type { Note } from "../../../shared/api/contracts";

/** Notas de un alumno, de la más reciente a la más antigua. */
export function studentNotes(notes: Note[], studentId: string) {
  return notes
    .filter((note) => note.studentId === studentId)
    .sort((left, right) => right.date.localeCompare(left.date));
}
