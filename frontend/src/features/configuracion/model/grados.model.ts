import type { Bootstrap, Grade } from "../../../shared/api/contracts";

export const trackLabel: Record<Grade["track"], string> = {
  color: "Cinta de color",
  poom: "Negra Poom (menores)",
  dan: "Negra Dan",
};

export type GradeUsage = { grade: Grade; students: number; history: number };

/** Cada grado con cuántos alumnos lo tienen y cuántas veces aparece en exámenes. */
export function gradeUsage(data: Bootstrap): GradeUsage[] {
  return data.grades.map((grade) => ({
    grade,
    students: data.students.filter((student) => student.gradeId === grade.id).length,
    history: data.exams
      .flatMap((exam) => exam.entries)
      .filter((entry) => entry.gradeFrom === grade.name || entry.gradeTo === grade.name).length,
  }));
}

/** Grado sugerido como reemplazo: el anterior del mismo tipo, o el siguiente si es el primero. */
export function suggestedReplacement(grades: Grade[], removing: Grade) {
  const sameTrack = grades.filter((grade) => grade.track === removing.track);
  const index = sameTrack.findIndex((grade) => grade.id === removing.id);
  return (sameTrack[index - 1] ?? sameTrack[index + 1] ?? grades.find((g) => g.id !== removing.id))
    ?.id;
}

/** Poom y Dan solo se pueden borrar desde el nivel más alto; las de color, cualquiera. */
export function canRemove(grades: Grade[], grade: Grade) {
  if (grades.length < 2) return false;
  if (grade.track === "color") return true;
  return (
    grade.level === Math.max(...grades.filter((g) => g.track === grade.track).map((g) => g.level))
  );
}
