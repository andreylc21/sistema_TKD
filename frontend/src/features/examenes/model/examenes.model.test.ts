import { describe, expect, it } from "vitest";
import type { Exam, ExamEntry, ExamProgress } from "../../../shared/api/contracts";
import {
  canEditExam,
  defaultDeadline,
  sortExams,
  studentExams,
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

describe("examenes.model", () => {
  it("nombra el grado negro al que aspira el alumno", () => {
    expect(targetLabel(progress(1, "dan"))).toBe("1er Dan");
    expect(targetLabel(progress(2, "dan"))).toBe("2º Dan");
    expect(targetLabel(progress(3, "dan"))).toBe("3er Dan");
    expect(targetLabel(progress(2, "poom"))).toBe("Poom 2");
  });

  it("separa pendientes e historial", () => {
    const exam = (id: string, date: string): Exam => ({
      id,
      kind: "partial",
      date,
      fee: 0,
      paymentDeadline: date,
      entries: [],
    });
    const open: Exam = {
      ...exam("e", "2026-02-01"),
      entries: [{ ...entry({}), result: "pending" }],
    };
    const { pending, history } = sortExams(
      [
        exam("a", "2026-03-01"),
        exam("b", "2026-12-01"),
        exam("c", "2026-11-30"),
        exam("d", "2026-01-01"),
        open,
      ],
      "2026-11-24",
    );
    expect(pending.map((item) => item.id)).toEqual(["e", "c", "b"]);
    expect(history.map((item) => item.id)).toEqual(["a", "d"]);
    expect(canEditExam(open)).toBe(true);
    expect(canEditExam({ ...open, entries: [{ ...entry({}), result: "passed" }] })).toBe(false);
  });
});

describe("pago del examen", () => {
  it("propone el plazo una semana antes del examen", () => {
    expect(defaultDeadline("2026-12-15")).toBe("2026-12-08");
  });

  it("junta los exámenes de un alumno, del más reciente al más antiguo", () => {
    const exam = (id: string, date: string, studentId: string): Exam => ({
      id,
      kind: "partial",
      date,
      fee: 0,
      paymentDeadline: date,
      entries: [{ ...entry({}), id: `en-${id}`, studentId }],
    });
    const rows = studentExams(
      [exam("a", "2026-01-01", "s"), exam("b", "2026-06-01", "s"), exam("c", "2026-07-01", "x")],
      "s",
    );
    expect(rows.map((row) => row.exam.id)).toEqual(["b", "a"]);
  });
});
