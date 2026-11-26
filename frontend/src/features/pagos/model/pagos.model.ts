import type { Bootstrap, Charge, Payment } from "../../../shared/api/contracts";
import { incomeByMonth } from "../../reportes/model/reportes.model";
import {
  dueStatus,
  paidFor,
  paymentProgress,
  type DueStatus,
  type PaymentProgress,
} from "../../../shared/lib/format";

export function balanceFor(charge: Charge, data: Bootstrap) {
  return charge.total - paidFor(charge.id, data.payments);
}

export function getPendingCharges(data: Bootstrap) {
  return data.charges.filter((charge) => balanceFor(charge, data) > 0);
}

export function chargePresentation(charge: Charge, data: Bootstrap) {
  const received = paidFor(charge.id, data.payments);
  const balance = Math.max(0, charge.total - received);
  return {
    received,
    balance,
    progress: paymentProgress(charge.total, received),
    due: dueStatus(charge.due, data.demoDate, balance),
  };
}

export function orderItemPending(item: { quantity: number; received: number; delivered: number }) {
  return {
    receive: Math.max(0, item.quantity - item.received),
    deliver: Math.max(0, item.received - item.delivered),
  };
}

// Tono de etiqueta (badge) de cada estado, igual en tablas, detalles e inicio.
export function progressTone(progress: PaymentProgress) {
  return progress === "Pagado" ? "success" : progress === "Pago parcial" ? "info" : "light";
}

export function dueTone(due: DueStatus) {
  if (due === "Vencido") return "danger";
  return due === "Próximo a pagar" || due === "Vence hoy" ? "warning" : "light";
}

export type PaymentLine = {
  payment: Payment;
  student: string;
  concept: string;
  category: string;
};

export type PaymentLineFilters = { query: string; month: string; category: string };

/** Cada pago con alumno, concepto y tipo de cobro, del más reciente al más antiguo. */
export function paymentLines(data: Bootstrap): PaymentLine[] {
  const charges = new Map(data.charges.map((charge) => [charge.id, charge]));
  const names = new Map(data.students.map((student) => [student.id, student.name]));
  return data.payments
    .map((payment) => ({
      payment,
      student: names.get(payment.studentId) ?? "—",
      concept: charges.get(payment.chargeId)?.concept ?? "—",
      category: charges.get(payment.chargeId)?.category ?? "—",
    }))
    .sort((a, b) => b.payment.date.localeCompare(a.payment.date));
}

/** Filtra por texto (alumno o concepto), mes "AAAA-MM" y tipo de cobro; vacío = todos. */
export function filterPaymentLines(lines: PaymentLine[], filters: PaymentLineFilters) {
  const query = filters.query.trim().toLocaleLowerCase("es");
  return lines.filter(
    (line) =>
      (!filters.month || line.payment.date.startsWith(filters.month)) &&
      (!filters.category || line.category === filters.category) &&
      (!query ||
        line.student.toLocaleLowerCase("es").includes(query) ||
        line.concept.toLocaleLowerCase("es").includes(query)),
  );
}

const csvCell = (value: string) =>
  /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

/** CSV con BOM para que Excel respete los acentos. */
export function paymentsCsv(lines: PaymentLine[]) {
  const rows = [
    ["Fecha", "Alumno", "Concepto", "Tipo", "Forma", "Estado", "Importe"],
    ...lines.map((line) => [
      line.payment.date,
      line.student,
      line.concept,
      line.category,
      line.payment.method || "Sin especificar",
      line.payment.valid ? "Vigente" : "Anulado",
      line.payment.amount.toFixed(2),
    ]),
  ];
  return "﻿" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

/**
 * Cifras de Pagos del mes de la fecha operativa: lo cobrado por cada tipo de cobro y lo que falta por
 * cobrar de mensualidades (las del mes y, aparte, las de meses anteriores). Pedidos y exámenes se cobran
 * al registrarse, así que solo tienen "cobrado".
 */
export function paymentsSummary(data: Bootstrap) {
  const month = data.demoDate.slice(0, 7);
  const income = incomeByMonth(data, [month])[0];
  let toCollect = 0;
  let previous = 0;
  for (const charge of data.charges) {
    if (charge.category !== "Mensualidades") continue;
    const balance = chargePresentation(charge, data).balance;
    if (balance <= 0) continue;
    if (charge.due.slice(0, 7) === month) toCollect += balance;
    else if (charge.due < `${month}-01`) previous += balance;
  }
  return {
    month,
    monthly: income.Mensualidades,
    orders: income.Pedidos,
    exams: income.Exámenes,
    toCollect,
    previous,
  };
}
