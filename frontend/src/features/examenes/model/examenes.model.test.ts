import { describe, expect, it } from "vitest";
import type { Exam, ExamEntry, ExamProgress } from "../../../shared/api/contracts";
import {
  canRecordResult,
  defaultDeadline,
  paymentState,
  sortExams,
  targetLabel,
} from "./examenes.model";

const progress = (target: number, track: ExamProgress["track"]): ExamProgress => ({
  target,
  track,
  partials: 0,
  required: 5,
  months: null,
  minMonths: 0,
  ready: false,
  missing: [],
});

describe("examenes.model", () => {
  it("nombra el grado negro al que aspira el alumno", () => {
    expect(targetLabel(progress(1, "dan"))).toBe("1er Dan");
    expect(targetLabel(progress(2, "dan"))).toBe("2º Dan");
    expect(targetLabel(progress(3, "dan"))).toBe("3er Dan");
    expect(targetLabel(progress(2, "poom"))).toBe("Poom 2");
  });

  it("separa próximos y pasados", () => {
    const exam = (id: string, date: string): Exam => ({
      id,
      kind: "partial",
      date,
      fee: 0,
      paymentDeadline: date,
      entries: [],
    });
    const { upcoming, past } = sortExams(
      [
        exam("a", "2026-03-01"),
        exam("b", "2026-12-01"),
        exam("c", "2026-11-30"),
        exam("d", "2026-01-01"),
      ],
      "2026-11-24",
    );
    expect(upcoming.map((item) => item.id)).toEqual(["c", "b"]);
    expect(past.map((item) => item.id)).toEqual(["a", "d"]);
  });
});

describe("pago del examen", () => {
  const entry = (patch: Partial<ExamEntry>): ExamEntry => ({
    id: "e",
    studentId: "s",
    gradeFrom: "Verde",
    gradeTo: null,
    result: "pending",
    reason: "",
    chargeId: "c",
    exception: "",
    owed: 100,
    total: 100,
    ...patch,
  });

  it("propone el plazo según el tipo de examen", () => {
    expect(defaultDeadline("partial", "2026-12-15")).toBe("2026-12-01");
    expect(defaultDeadline("black", "2026-12-15")).toBe("2026-11-15");
  });

  it("distingue pagado, pendiente, vencido y excepción", () => {
    expect(paymentState(entry({ owed: 0 }), "2026-12-01", "2026-12-20")).toBe("paid");
    expect(paymentState(entry({}), "2026-12-01", "2026-11-20")).toBe("pending");
    expect(paymentState(entry({ owed: 40 }), "2026-12-01", "2026-11-20")).toBe("partial");
    expect(paymentState(entry({}), "2026-12-01", "2026-12-02")).toBe("overdue");
    expect(paymentState(entry({ exception: "Beca" }), "2026-12-01", "2026-12-02")).toBe(
      "exception",
    );
  });

  it("sólo permite registrar el resultado con pago o excepción", () => {
    expect(canRecordResult("paid")).toBe(true);
    expect(canRecordResult("exception")).toBe(true);
    expect(canRecordResult("pending")).toBe(false);
    expect(canRecordResult("overdue")).toBe(false);
  });
});
