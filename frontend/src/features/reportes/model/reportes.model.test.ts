import { describe, expect, it } from "vitest";
import type { Bootstrap } from "../../../shared/api/contracts";
import {
  debtors,
  examSummaries,
  incomeByMonth,
  monthsEnding,
  movements,
  paymentsOfMonth,
  yearToDate,
} from "./reportes.model";

const data = {
  students: [
    { id: "a", name: "Ana", enrollmentDate: "2026-09-10", inactiveAt: null },
    { id: "b", name: "Beto", enrollmentDate: "2026-01-05", inactiveAt: "2026-10-20" },
  ],
  charges: [
    { id: "c1", studentId: "a", category: "Mensualidades", total: 500, due: "2026-10-05" },
    { id: "c2", studentId: "a", category: "Exámenes", total: 300, due: "2026-11-01" },
    { id: "c3", studentId: "b", category: "Pedidos", total: 100, due: "2026-11-10" },
  ],
  payments: [
    { id: "p1", chargeId: "c1", date: "2026-10-06", amount: 500, valid: true },
    { id: "p2", studentId: "a", chargeId: "c2", date: "2026-11-02", amount: 100, valid: true },
    { id: "p3", chargeId: "c3", date: "2026-11-03", amount: 100, valid: false },
  ],
  exams: [
    {
      id: "e1",
      kind: "partial",
      date: "2026-11-20",
      entries: [
        { id: "x", studentId: "a", result: "passed", chargeId: "c2" },
        { id: "y", studentId: "b", result: "pending", chargeId: "" },
      ],
    },
  ],
} as unknown as Bootstrap;

describe("reportes.model", () => {
  it("arma los meses terminando en el elegido, cruzando de año", () => {
    expect(monthsEnding("2026-02", 4)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });

  it("suma ingresos válidos por mes y tipo de cobro", () => {
    const [oct, nov] = incomeByMonth(data, ["2026-10", "2026-11"]);
    expect(oct).toMatchObject({ total: 500, passThrough: 0, Mensualidades: 500 });
    expect(nov).toMatchObject({ total: 0, passThrough: 100, Exámenes: 100, Pedidos: 0 });
  });

  it("acumula solo mensualidades en el año", () => {
    expect(yearToDate(data, "2026-11")).toMatchObject({ year: "2026", total: 500, months: 11 });
  });

  it("lista los pagos válidos del mes con quién pagó", () => {
    const rows = paymentsOfMonth(data, "2026-11");
    expect(rows.map((row) => [row.student, row.amount])).toEqual([["Ana", 100]]);
  });

  it("lista a quien debe, del mayor saldo al menor, con días de atraso", () => {
    const rows = debtors(data, "2026-11-24");
    expect(rows.map((row) => [row.name, row.balance])).toEqual([
      ["Ana", 200],
      ["Beto", 100],
    ]);
    expect(rows[0].daysLate).toBe(23);
  });

  it("cuenta altas, bajas y activos al cierre", () => {
    const [sep, oct] = movements(data.students, ["2026-09", "2026-10"]);
    expect(sep).toEqual({ month: "2026-09", joined: 1, left: 0, active: 2 });
    expect(oct).toEqual({ month: "2026-10", joined: 0, left: 1, active: 1 });
  });

  it("resume los exámenes del mes", () => {
    const [summary] = examSummaries(data, "2026-11");
    expect(summary).toMatchObject({
      enrolled: 2,
      passed: 1,
      failed: 0,
      waiting: 1,
      collected: 100,
    });
    expect(examSummaries(data, "2026-10")).toEqual([]);
  });
});
