import { describe, expect, it } from "vitest";
import type { Bootstrap, Session } from "../../../shared/api/contracts";
import {
  debtorsInSession,
  examForSession,
  nextSession,
  overdueTotal,
  stoppedComing,
  weeklyAttendance,
} from "./inicio.model";

const data = {
  demoDate: "2026-10-03",
  students: [
    { id: "a", name: "Ana" },
    { id: "b", name: "Beto" },
  ],
  sessions: [
    { id: "s0", date: "2026-10-02", time: "09:00", status: "Programada", attendance: [] },
    { id: "s2", date: "2026-10-05", time: "18:00", status: "Programada", attendance: [] },
    {
      id: "s1",
      date: "2026-10-03",
      time: "09:00",
      status: "Programada",
      attendance: [{ studentId: "a" }],
    },
    { id: "sx", date: "2026-10-03", time: "07:00", status: "Cancelada", attendance: [] },
  ],
  charges: [
    { id: "c1", studentId: "a", total: 500, due: "2026-09-01" },
    { id: "c2", studentId: "b", total: 300, due: "2026-09-01" },
    { id: "c3", studentId: "a", total: 200, due: "2026-12-01" },
  ],
  payments: [],
  exams: [
    { id: "e1", date: "2026-10-17", entries: [{ studentId: "a", result: "pending" }] },
    { id: "e0", date: "2026-09-01", entries: [{ studentId: "a", result: "passed" }] },
  ],
} as unknown as Bootstrap;

describe("inicio.model", () => {
  it("elige la siguiente clase no cancelada desde hoy", () => {
    expect(nextSession(data)?.id).toBe("s1");
  });

  it("suma lo vencido de toda la escuela", () => {
    expect(overdueTotal(data)).toBe(800);
  });

  it("lista solo a los alumnos de la clase que deben", () => {
    const session = data.sessions.find((item) => item.id === "s1") as Session;
    expect(debtorsInSession(data, session)).toEqual([
      { studentId: "a", name: "Ana", balance: 500, chargeId: "c1" },
    ]);
  });

  it("encuentra el próximo examen con alumnos de la clase", () => {
    const session = data.sessions.find((item) => item.id === "s1") as Session;
    expect(examForSession(data, session)).toEqual({ date: "2026-10-17", enrolled: 1 });
    expect(examForSession(data, data.sessions[1] as Session)).toBeNull();
  });

  it("cuenta la asistencia de los últimos 7 días sin las clases sin registrar", () => {
    const week = {
      demoDate: "2026-10-03",
      sessions: [
        {
          date: "2026-10-02",
          status: "Programada",
          attendance: [
            { studentId: "a", status: "Presente" },
            { studentId: "b", status: "Ausente" },
            { studentId: "c", status: "Sin registrar" },
          ],
        },
        {
          date: "2026-09-20",
          status: "Programada",
          attendance: [{ studentId: "a", status: "Ausente" }],
        },
      ],
    } as unknown as Bootstrap;
    expect(weeklyAttendance(week)).toEqual({ present: 1, recorded: 2, percent: 50 });
    expect(weeklyAttendance({ ...week, sessions: [] } as Bootstrap).percent).toBeNull();
  });

  it("detecta a quien faltó dos clases seguidas y recuerda cuándo vino por última vez", () => {
    const att = (status: string) => [{ studentId: "a", status }];
    const world = {
      demoDate: "2026-10-10",
      students: [
        { id: "a", name: "Ana", status: "Activo" },
        { id: "b", name: "Beto", status: "Inactivo" },
      ],
      sessions: [
        { date: "2026-10-09", time: "18:00", status: "Programada", attendance: att("Ausente") },
        {
          date: "2026-10-07",
          time: "18:00",
          status: "Programada",
          attendance: att("Falta justificada"),
        },
        { date: "2026-10-05", time: "18:00", status: "Programada", attendance: att("Presente") },
        {
          date: "2026-10-10",
          time: "09:00",
          status: "Programada",
          attendance: att("Sin registrar"),
        },
      ],
    } as unknown as Bootstrap;
    expect(stoppedComing(world)).toEqual([
      { studentId: "a", name: "Ana", misses: 2, lastSeen: "2026-10-05" },
    ]);
    expect(stoppedComing(world, 3)).toEqual([]);
  });
});
