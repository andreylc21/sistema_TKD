import { describe, expect, it } from "vitest";
import type { Bootstrap, Grade } from "../../../shared/api/contracts";
import { canRemove, gradeUsage, suggestedReplacement } from "./grados.model";

const grades: Grade[] = [
  { id: "b", name: "Blanca", track: "color", level: 1 },
  { id: "a", name: "Amarilla", track: "color", level: 2 },
  { id: "d1", name: "Negra 1º Dan", track: "dan", level: 1 },
  { id: "d2", name: "Negra 2º Dan", track: "dan", level: 2 },
];

describe("grados.model", () => {
  it("cuenta alumnos e historial por grado", () => {
    const data = {
      grades,
      students: [{ gradeId: "a" }, { gradeId: "a" }, { gradeId: "b" }],
      exams: [{ entries: [{ gradeFrom: "Blanca", gradeTo: "Amarilla" }] }],
    } as unknown as Bootstrap;
    const usage = gradeUsage(data);
    expect(usage.find((row) => row.grade.id === "a")).toMatchObject({ students: 2, history: 1 });
    expect(usage.find((row) => row.grade.id === "d1")).toMatchObject({ students: 0, history: 0 });
  });

  it("sugiere el anterior del mismo tipo o el siguiente si es el primero", () => {
    expect(suggestedReplacement(grades, grades[1])).toBe("b");
    expect(suggestedReplacement(grades, grades[0])).toBe("a");
    expect(suggestedReplacement(grades, grades[3])).toBe("d1");
  });

  it("solo deja borrar el nivel más alto de Dan", () => {
    expect(canRemove(grades, grades[0])).toBe(true);
    expect(canRemove(grades, grades[2])).toBe(false);
    expect(canRemove(grades, grades[3])).toBe(true);
    expect(canRemove([grades[0]], grades[0])).toBe(false);
  });
});
