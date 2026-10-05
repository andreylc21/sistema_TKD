import { describe, expect, it } from "vitest";
import type { Note } from "../../../shared/api/contracts";
import { studentNotes } from "./alumnos.model";

const note = (id: string, studentId: string, date: string): Note => ({
  id,
  studentId,
  date,
  topic: "Técnica",
  text: "Texto",
  version: 1,
});

describe("studentNotes", () => {
  it("devuelve sólo las notas del alumno, primero las más recientes", () => {
    const notes = [
      note("a", "s1", "2026-09-01"),
      note("b", "s2", "2026-10-01"),
      note("c", "s1", "2026-10-03"),
      note("d", "s1", "2026-09-15"),
    ];
    expect(studentNotes(notes, "s1").map((item) => item.id)).toEqual(["c", "d", "a"]);
  });
});
