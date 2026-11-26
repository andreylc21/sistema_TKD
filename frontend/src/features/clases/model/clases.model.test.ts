import { describe, expect, it } from "vitest";
import type { Group, Session, Student } from "../../../shared/api/contracts";
import {
  activeGroups,
  ageAlerts,
  ageLabel,
  nextClass,
  overlappingGroups,
  sessionPhase,
} from "./clases.model";

const group = (patch: Partial<Group>): Group => ({
  id: "g1",
  name: "Infantil",
  days: ["Lunes"],
  time: "17:00–18:00",
  students: [],
  kept: [],
  archived: false,
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

describe("grupos archivados", () => {
  it("no generan avisos de edad ni cuentan como grupos en uso", () => {
    const archived = group({ archived: true, maxAge: 9, students: ["s1"] });
    expect(activeGroups([archived, group({})])).toHaveLength(1);
    expect(ageAlerts([archived], [student("s1", 10)])).toEqual([]);
  });
});

describe("overlappingGroups", () => {
  const monday = "2026-10-05";
  const none = { sessions: [] as never[] };

  it("avisa de otro grupo con clase a la misma hora ese día de la semana", () => {
    const a = group({ id: "a", name: "A", days: ["Lunes"], time: "17:00–18:00" });
    const b = group({ id: "b", name: "B", days: ["Lunes"], time: "17:30–18:30" });
    expect(overlappingGroups({ groups: [a, b], ...none }, a, monday).map((g) => g.id)).toEqual([
      "b",
    ]);
  });

  it("no avisa si el horario no coincide o es otro día", () => {
    const a = group({ id: "a", days: ["Lunes"], time: "17:00–18:00" });
    const later = group({ id: "b", days: ["Lunes"], time: "18:00–19:00" });
    const otherDay = group({ id: "c", days: ["Martes"], time: "17:00–18:00" });
    expect(overlappingGroups({ groups: [a, later, otherDay], ...none }, a, monday)).toEqual([]);
  });

  it("cuenta la clase ya abierta de otro grupo aunque no sea su día", () => {
    const a = group({ id: "a", days: ["Lunes"], time: "17:00–18:00" });
    const b = group({ id: "b", days: ["Jueves"], time: "17:00–18:00" });
    const sessions = [{ groupId: "b", date: monday, time: "17:00–18:00", status: "Programada" }];
    expect(overlappingGroups({ groups: [a, b], sessions }, a, monday).map((g) => g.id)).toEqual([
      "b",
    ]);
  });
});

describe("sessionPhase", () => {
  const base = {
    id: "s",
    groupId: "g",
    date: "2026-10-05",
    time: "17:00–18:00",
    status: "Programada",
    startedAt: null,
    endedAt: null,
    attendance: [],
    version: 1,
  } as Session;
  const started = new Date("2026-10-05T17:05:00Z").getTime();

  it("una clase que no se ha dado sigue Programada", () => {
    expect(sessionPhase(base, started)).toBe("Programada");
  });

  it("está En curso mientras no pase su duración", () => {
    const given = { ...base, startedAt: new Date(started).toISOString() };
    expect(sessionPhase(given, started + 30 * 60_000)).toBe("En curso");
  });

  it("termina sola al pasar la duración del horario desde que se dio", () => {
    const given = { ...base, startedAt: new Date(started).toISOString() };
    expect(sessionPhase(given, started + 61 * 60_000)).toBe("Terminada");
  });

  it("termina al pulsar Terminar aunque falte tiempo", () => {
    const finished = {
      ...base,
      startedAt: new Date(started).toISOString(),
      endedAt: new Date(started + 20 * 60_000).toISOString(),
    };
    expect(sessionPhase(finished, started + 25 * 60_000)).toBe("Terminada");
  });

  it("conserva el estado de las canceladas", () => {
    expect(sessionPhase({ ...base, status: "Cancelada" }, started)).toBe("Cancelada");
  });
});

describe("nextClass", () => {
  const monday = group({ id: "m", name: "Lunes", days: ["Lunes"], time: "17:00–18:00" });
  const wednesday = group({ id: "w", name: "Miércoles", days: ["Miércoles"], time: "17:00–18:00" });
  const none = { groups: [monday, wednesday], sessions: [] as Session[] };

  it("toma la clase de hoy si todavía no se da", () => {
    expect(nextClass(none, "2026-10-05")?.group.id).toBe("m");
  });

  it("salta al siguiente día con clase cuando hoy no hay", () => {
    expect(nextClass(none, "2026-10-03")).toMatchObject({ date: "2026-10-05" });
    expect(nextClass(none, "2026-10-03")?.group.id).toBe("m");
  });

  it("deja pasar la clase de hoy si ya terminó", () => {
    const started = new Date("2026-10-05T17:00:00Z").toISOString();
    const done = {
      id: "s",
      groupId: "m",
      date: "2026-10-05",
      time: "17:00–18:00",
      status: "Programada",
      startedAt: started,
      endedAt: started,
      attendance: [],
      version: 1,
    } as Session;
    expect(nextClass({ ...none, sessions: [done] }, "2026-10-05")?.group.id).toBe("w");
  });
});
