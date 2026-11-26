import type { Bootstrap, Session } from "../../../shared/api/contracts";
import { chargePresentation } from "../../pagos/model/pagos.model";
import { incomeByMonth, monthOf } from "../../reportes/model/reportes.model";

/** La siguiente clase de hoy en adelante que no esté cancelada. */
export function nextSession(data: Bootstrap): Session | undefined {
  return data.sessions
    .filter((session) => session.date >= data.demoDate && session.status !== "Cancelada")
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))[0];
}

type OverdueCharge = { id: string; studentId: string; balance: number };

function overdueCharges(data: Bootstrap): OverdueCharge[] {
  return data.charges
    .map((charge) => ({ charge, state: chargePresentation(charge, data) }))
    .filter(({ state }) => state.balance > 0 && state.due === "Vencido")
    .map(({ charge, state }) => ({
      id: charge.id,
      studentId: charge.studentId,
      balance: state.balance,
    }));
}

/** Total en dinero de todos los cargos vencidos de la escuela. */
export function overdueTotal(data: Bootstrap) {
  return overdueCharges(data).reduce((sum, charge) => sum + charge.balance, 0);
}

/** Mensualidades cobradas en el mes de la fecha operativa (lo mismo que cuenta Reportes). */
export function collectedThisMonth(data: Bootstrap) {
  return incomeByMonth(data, [monthOf(data.demoDate)])[0].total;
}

export type ClassDebtor = { studentId: string; name: string; balance: number; chargeId: string };

/** Alumnos de la clase con saldo vencido, del que más debe al que menos. */
export function debtorsInSession(data: Bootstrap, session: Session): ClassDebtor[] {
  const inClass = new Set(session.attendance.map((entry) => entry.studentId));
  const byStudent = new Map<string, ClassDebtor>();
  for (const charge of overdueCharges(data)) {
    if (!inClass.has(charge.studentId)) continue;
    const current = byStudent.get(charge.studentId);
    byStudent.set(charge.studentId, {
      studentId: charge.studentId,
      name: data.students.find((student) => student.id === charge.studentId)?.name ?? "—",
      balance: (current?.balance ?? 0) + charge.balance,
      chargeId: current?.chargeId ?? charge.id,
    });
  }
  return [...byStudent.values()].sort((a, b) => b.balance - a.balance);
}

/** Próximo examen sin resultados desde hoy, con cuántos alumnos de la clase están inscritos. */
export function examForSession(data: Bootstrap, session: Session) {
  const inClass = new Set(session.attendance.map((entry) => entry.studentId));
  const exam = data.exams
    .filter(
      (item) =>
        item.date >= data.demoDate && item.entries.every((entry) => entry.result === "pending"),
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .find((item) => item.entries.some((entry) => inClass.has(entry.studentId)));
  if (!exam) return null;
  return {
    date: exam.date,
    enrolled: exam.entries.filter((entry) => inClass.has(entry.studentId)).length,
  };
}

const dayNumber = (day: string) => Math.floor(new Date(`${day}T12:00:00`).getTime() / 86_400_000);

/** Presentes entre las asistencias ya registradas de los últimos 7 días (hoy incluido). */
export function weeklyAttendance(data: Bootstrap) {
  const today = dayNumber(data.demoDate);
  let present = 0;
  let recorded = 0;
  for (const session of data.sessions) {
    const age = today - dayNumber(session.date);
    if (age < 0 || age > 6 || session.status === "Cancelada") continue;
    for (const entry of session.attendance) {
      if (entry.status === "Sin registrar") continue;
      recorded += 1;
      if (entry.status === "Presente") present += 1;
    }
  }
  return { present, recorded, percent: recorded ? Math.round((present / recorded) * 100) : null };
}

export type StoppedStudent = {
  studentId: string;
  name: string;
  misses: number;
  lastSeen: string | null;
};

/**
 * Alumnos activos que faltaron (ausente o con falta justificada) a sus últimas clases
 * registradas, `minMisses` o más seguidas. Es la señal más temprana de que se van a dar de baja.
 */
export function stoppedComing(data: Bootstrap, minMisses = 2): StoppedStudent[] {
  const past = data.sessions
    .filter((session) => session.date <= data.demoDate && session.status !== "Cancelada")
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  const out: StoppedStudent[] = [];
  for (const student of data.students) {
    if (student.status !== "Activo") continue;
    let misses = 0;
    let lastSeen: string | null = null;
    for (const session of past) {
      const entry = session.attendance.find((item) => item.studentId === student.id);
      if (!entry || entry.status === "Sin registrar") continue;
      if (entry.status === "Presente") {
        lastSeen = session.date;
        break;
      }
      misses += 1;
    }
    if (misses >= minMisses)
      out.push({ studentId: student.id, name: student.name, misses, lastSeen });
  }
  return out.sort((a, b) => b.misses - a.misses || a.name.localeCompare(b.name, "es"));
}

/** Cobros sin pagar completos, del más antiguo al más reciente. */
export function unpaidCharges(data: Bootstrap) {
  return data.charges
    .filter((charge) => chargePresentation(charge, data).balance > 0)
    .sort((a, b) => a.due.localeCompare(b.due));
}

/** El examen más cercano desde hoy en adelante. */
export function nextExam(data: Bootstrap) {
  return data.exams
    .filter((exam) => exam.date >= data.demoDate)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
}

const shiftDay = (day: string, count: number) => {
  const next = new Date(`${day}T12:00:00`);
  next.setDate(next.getDate() + count);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
};

/** Cobros sin pagar que ya vencieron o vencen en los próximos 7 días, del más antiguo al más reciente. */
export function unpaidThisWeek(data: Bootstrap) {
  const limit = shiftDay(data.demoDate, 7);
  return unpaidCharges(data).filter((charge) => charge.due <= limit);
}

/** La nota más reciente de cada alumno del grupo, de la más nueva a la más vieja. */
export function latestNotes(data: Bootstrap, studentIds: string[]) {
  const latest = new Map<string, Bootstrap["notes"][number]>();
  for (const note of data.notes) {
    if (!studentIds.includes(note.studentId)) continue;
    const current = latest.get(note.studentId);
    if (!current || note.date > current.date) latest.set(note.studentId, note);
  }
  return [...latest.values()].sort((a, b) => b.date.localeCompare(a.date));
}
