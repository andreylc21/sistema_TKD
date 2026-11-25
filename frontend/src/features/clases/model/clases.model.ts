import type { Group, Student } from "../../../shared/api/contracts";

/** "6 a 9 años", "Desde 16 años", "Hasta 9 años" o "Todas las edades". */
export function ageLabel(group: Pick<Group, "minAge" | "maxAge">) {
  const { minAge, maxAge } = group;
  if (minAge != null && maxAge != null) return `${minAge} a ${maxAge} años`;
  if (minAge != null) return `Desde ${minAge} años`;
  if (maxAge != null) return `Hasta ${maxAge} años`;
  return "Todas las edades";
}

export function ageFits(group: Pick<Group, "minAge" | "maxAge">, age: number) {
  return (
    (group.minAge == null || age >= group.minAge) && (group.maxAge == null || age <= group.maxAge)
  );
}

export type AgeAlert = { student: Student; group: Group; reason: string };

function reasonFor(group: Group, age: number) {
  const base = `tiene ${age} años y el grupo es `;
  if (group.maxAge != null && age > group.maxAge) return `${base}hasta ${group.maxAge}`;
  return `${base}desde ${group.minAge}`;
}

/** Alumnos activos fuera del perfil de edad de su grupo, salvo los que la maestra decidió mantener. */
export function ageAlerts(groups: Group[], students: Student[]): AgeAlert[] {
  const byId = new Map(students.map((student) => [student.id, student]));
  return groups.flatMap((group) =>
    group.students.flatMap((id) => {
      const student = byId.get(id);
      if (!student || student.status !== "Activo" || group.kept.includes(id)) return [];
      return ageFits(group, student.age)
        ? []
        : [{ student, group, reason: reasonFor(group, student.age) }];
    }),
  );
}
