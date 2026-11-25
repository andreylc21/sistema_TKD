import { describe, expect, it } from "vitest";
import type { Group, Student } from "../../../shared/api/contracts";
import { ageAlerts, ageLabel } from "./clases.model";

const group = (patch: Partial<Group>): Group => ({
  id: "g1",
  name: "Infantil",
  days: ["Lunes"],
  time: "17:00–18:00",
  students: [],
  kept: [],
  minAge: null,
  maxAge: null,
  version: 1,
  ...patch,
});
const student = (id: string, age: number, status: Student["status"] = "Activo") =>
  ({ id, name: id, age, status }) as Student;

describe("clases.model", () => {
  it("describe el perfil de edad", () => {
    expect(ageLabel(group({ minAge: 6, maxAge: 9 }))).toBe("6 a 9 años");
    expect(ageLabel(group({ minAge: 16 }))).toBe("Desde 16 años");
    expect(ageLabel(group({ maxAge: 9 }))).toBe("Hasta 9 años");
    expect(ageLabel(group({}))).toBe("Todas las edades");
  });

  it("avisa de quien se pasó del rango, salvo si se decidió mantenerlo", () => {
    const infantil = group({ maxAge: 9, students: ["a", "b", "c", "d"], kept: ["c"] });
    const alerts = ageAlerts(
      [infantil],
      [student("a", 10), student("b", 8), student("c", 12), student("d", 11, "Inactivo")],
    );
    expect(alerts.map((alert) => alert.student.id)).toEqual(["a"]);
    expect(alerts[0].reason).toBe("tiene 10 años y el grupo es hasta 9");
  });

  it("avisa de quien aún no llega al mínimo", () => {
    const adultos = group({ minAge: 16, students: ["a"] });
    expect(ageAlerts([adultos], [student("a", 14)])[0].reason).toBe(
      "tiene 14 años y el grupo es desde 16",
    );
  });
});
