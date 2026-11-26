import type { Bootstrap, Exam } from "../../../shared/api/contracts";
import { paidFor } from "../../../shared/lib/format";

export const categories = ["Mensualidades", "Exámenes", "Pedidos"] as const;
export type Category = (typeof categories)[number];

/** "2026-11-24" → "2026-11". */
export const monthOf = (day: string) => day.slice(0, 7);

/** Meses terminados en `last`, del más antiguo al más reciente. */
export function monthsEnding(last: string, count: number) {
  const [year, month] = last.split("-").map(Number);
  return Array.from({ length: count }, (_, index) => {
    const offset = count - 1 - index;
    const absolute = year * 12 + (month - 1) - offset;
    return `${Math.floor(absolute / 12)}-${String((absolute % 12) + 1).padStart(2, "0")}`;
  });
}

export function monthLabel(month: string) {
  const parsed = new Date(`${month}-01T12:00:00`);
  const text = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(parsed);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export type IncomeRow = { month: string; total: number; passThrough: number } & Record<
  Category,
  number
>;

/** Lo que la escuela se queda: solo las mensualidades. Exámenes y pedidos son de paso. */
export const ownCategory: Category = "Mensualidades";

/**
 * Pagos válidos recibidos en cada mes, repartidos por tipo de cobro. `total` cuenta solo
 * mensualidades; lo cobrado por exámenes y pedidos va en `passThrough` porque se entrega
 * a la institución o al proveedor.
 */
export function incomeByMonth(data: Bootstrap, months: string[]): IncomeRow[] {
  const categoryOf = new Map(data.charges.map((charge) => [charge.id, charge.category]));
  return months.map((month) => {
    const row: IncomeRow = {
      month,
      total: 0,
      passThrough: 0,
      Mensualidades: 0,
      Exámenes: 0,
      Pedidos: 0,
    };
    for (const payment of data.payments) {
      if (!payment.valid || monthOf(payment.date) !== month) continue;
      const category = categoryOf.get(payment.chargeId);
      if (!category || !(categories as readonly string[]).includes(category)) continue;
      row[category as Category] += payment.amount;
      if (category === ownCategory) row.total += payment.amount;
      else row.passThrough += payment.amount;
    }
    return row;
  });
}

/** Mensualidades cobradas del enero del año de `month` hasta `month` inclusive. */
export function yearToDate(data: Bootstrap, month: string) {
  const year = month.slice(0, 4);
  const monthsOfYear = monthsEnding(month, Number(month.slice(5)));
  const rows = incomeByMonth(data, monthsOfYear);
  return { year, total: rows.reduce((sum, row) => sum + row.total, 0), months: rows.length };
}

export type PaymentRow = {
  id: string;
  date: string;
  student: string;
  concept: string;
  category: string;
  method: string;
  amount: number;
};

/** Pagos válidos del mes con quién y cuándo, del más reciente al más antiguo. */
export function paymentsOfMonth(data: Bootstrap, month: string): PaymentRow[] {
  const charges = new Map(data.charges.map((charge) => [charge.id, charge]));
  const names = new Map(data.students.map((student) => [student.id, student.name]));
  return data.payments
    .filter((payment) => payment.valid && monthOf(payment.date) === month)
    .map((payment) => {
      const charge = charges.get(payment.chargeId);
      return {
        id: payment.id,
        date: payment.date,
        student: names.get(payment.studentId) ?? "—",
        concept: charge?.concept ?? "—",
        category: charge?.category ?? "—",
        method: payment.method,
        amount: payment.amount,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export type Debtor = {
  studentId: string;
  name: string;
  balance: number;
  charges: number;
  oldestDue: string;
  daysLate: number;
};

const dayNumber = (day: string) => Math.floor(new Date(`${day}T12:00:00`).getTime() / 86_400_000);

/** Alumnos con saldo, del que más debe al que menos, con el atraso del cobro más antiguo. */
export function debtors(data: Bootstrap, today: string): Debtor[] {
  const byStudent = new Map<string, Debtor>();
  for (const charge of data.charges) {
    const owed = charge.total - paidFor(charge.id, data.payments);
    if (owed <= 0.005) continue;
    const current = byStudent.get(charge.studentId);
    const name = data.students.find((student) => student.id === charge.studentId)?.name ?? "—";
    byStudent.set(charge.studentId, {
      studentId: charge.studentId,
      name,
      balance: (current?.balance ?? 0) + owed,
      charges: (current?.charges ?? 0) + 1,
      oldestDue: current && current.oldestDue < charge.due ? current.oldestDue : charge.due,
      daysLate: 0,
    });
  }
  return [...byStudent.values()]
    .map((item) => ({
      ...item,
      daysLate: Math.max(0, dayNumber(today) - dayNumber(item.oldestDue)),
    }))
    .sort((a, b) => b.balance - a.balance);
}

export type MovementRow = { month: string; joined: number; left: number; active: number };

/** Altas, bajas y alumnos activos al cierre de cada mes. */
export function movements(students: Bootstrap["students"], months: string[]): MovementRow[] {
  return months.map((month) => {
    const end = `${month}-31`;
    return {
      month,
      joined: students.filter((student) => monthOf(student.enrollmentDate) === month).length,
      left: students.filter(
        (student) => student.inactiveAt && monthOf(student.inactiveAt) === month,
      ).length,
      active: students.filter(
        (student) =>
          student.enrollmentDate <= end && (!student.inactiveAt || student.inactiveAt > end),
      ).length,
    };
  });
}

export type ExamSummary = {
  exam: Exam;
  enrolled: number;
  passed: number;
  failed: number;
  waiting: number;
  collected: number;
};

/** Resultados y recaudación de los exámenes que cayeron en el mes. */
export function examSummaries(data: Bootstrap, month: string): ExamSummary[] {
  return data.exams
    .filter((exam) => monthOf(exam.date) === month)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((exam) => ({
      exam,
      enrolled: exam.entries.length,
      passed: exam.entries.filter((entry) => entry.result === "passed").length,
      failed: exam.entries.filter((entry) => entry.result === "failed").length,
      waiting: exam.entries.filter((entry) => entry.result === "pending").length,
      collected: exam.entries.reduce(
        (sum, entry) => sum + (entry.chargeId ? paidFor(entry.chargeId, data.payments) : 0),
        0,
      ),
    }));
}

export type AttendanceRow = {
  month: string;
  present: number;
  recorded: number;
  percent: number | null;
};

/** Asistencia registrada en las clases de cada mes (las canceladas y las "sin registrar" no cuentan). */
export function attendanceByMonth(data: Bootstrap, months: string[]): AttendanceRow[] {
  return months.map((month) => {
    let present = 0;
    let recorded = 0;
    for (const session of data.sessions) {
      if (monthOf(session.date) !== month || session.status === "Cancelada") continue;
      for (const entry of session.attendance) {
        if (entry.status === "Sin registrar") continue;
        recorded += 1;
        if (entry.status === "Presente") present += 1;
      }
    }
    return {
      month,
      present,
      recorded,
      percent: recorded ? Math.round((present / recorded) * 100) : null,
    };
  });
}

/** Alumnos que presentaron examen en el mes y cuántos aprobaron (cada aprobado sube una cinta). */
export function examResults(data: Bootstrap, month: string) {
  let presented = 0;
  let passed = 0;
  for (const exam of data.exams) {
    if (monthOf(exam.date) !== month) continue;
    for (const entry of exam.entries) {
      if (entry.result === "pending") continue;
      presented += 1;
      if (entry.result === "passed") passed += 1;
    }
  }
  return { presented, passed };
}

/** Todo lo que está sin pagar hoy, de cualquier tipo de cobro. */
export function totalUnpaid(data: Bootstrap) {
  return data.charges.reduce(
    (sum, charge) => sum + Math.max(0, charge.total - paidFor(charge.id, data.payments)),
    0,
  );
}
