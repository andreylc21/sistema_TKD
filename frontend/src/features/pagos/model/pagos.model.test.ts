import { describe, expect, it } from "vitest";
import type { Bootstrap, Charge, Payment } from "../../../shared/api/contracts";
import {
  chargePresentation,
  filterPaymentLines,
  orderItemPending,
  paymentLines,
  paymentsCsv,
  paymentsSummary,
} from "./pagos.model";

const charge = { id: "c1", studentId: "s1", total: 600, due: "2026-10-01" } as Charge;
const payment = (amount: number, valid: boolean) => ({ chargeId: "c1", amount, valid }) as Payment;
const world = (payments: Payment[]) =>
  ({ demoDate: "2026-10-03", payments, charges: [charge] }) as unknown as Bootstrap;

describe("chargePresentation", () => {
  it("shows a partial payment with the remaining balance and an overdue alert", () => {
    expect(chargePresentation(charge, world([payment(400, true)]))).toMatchObject({
      received: 400,
      balance: 200,
      progress: "Pago parcial",
      due: "Vencido",
    });
  });

  it("restores the full balance when the only payment is voided", () => {
    expect(chargePresentation(charge, world([payment(400, false)]))).toMatchObject({
      received: 0,
      balance: 600,
      progress: "Sin pagos",
    });
  });

  it("drops the due alert once the charge is fully paid", () => {
    expect(chargePresentation(charge, world([payment(600, true)]))).toMatchObject({
      progress: "Pagado",
      due: null,
    });
  });
});

describe("orderItemPending", () => {
  it("keeps reception and delivery pending quantities independent", () => {
    expect(orderItemPending({ quantity: 3, received: 2, delivered: 1 })).toEqual({
      receive: 1,
      deliver: 1,
    });
    expect(orderItemPending({ quantity: 2, received: 0, delivered: 0 })).toEqual({
      receive: 2,
      deliver: 0,
    });
  });
});

describe("lista de pagos", () => {
  const data = {
    students: [{ id: "a", name: "Ana, M." }],
    charges: [
      { id: "c1", studentId: "a", concept: "Mensualidad octubre", category: "Mensualidades" },
    ],
    payments: [
      {
        id: "p1",
        studentId: "a",
        chargeId: "c1",
        date: "2026-10-06",
        amount: 500,
        method: "",
        valid: true,
      },
      {
        id: "p2",
        studentId: "a",
        chargeId: "c1",
        date: "2026-11-02",
        amount: 100,
        method: "Efectivo",
        valid: false,
      },
    ],
  } as unknown as Bootstrap;

  it("ordena, filtra por mes y exporta con comillas y BOM", () => {
    const lines = paymentLines(data);
    expect(lines.map((line) => line.payment.id)).toEqual(["p2", "p1"]);
    const october = filterPaymentLines(lines, { query: "", month: "2026-10", category: "" });
    expect(october).toHaveLength(1);
    expect(filterPaymentLines(lines, { query: "zzz", month: "", category: "" })).toHaveLength(0);
    const csv = paymentsCsv(october);
    expect(csv.startsWith("﻿Fecha,")).toBe(true);
    expect(csv).toContain(
      '2026-10-06,"Ana, M.",Mensualidad octubre,Mensualidades,Sin especificar,Vigente,500.00',
    );
  });
});

describe("paymentsSummary", () => {
  it("separa lo cobrado por tipo y lo que falta de mensualidades del mes y de meses anteriores", () => {
    const data = {
      demoDate: "2026-10-03",
      charges: [
        { id: "m1", studentId: "a", category: "Mensualidades", total: 500, due: "2026-10-05" },
        { id: "m2", studentId: "a", category: "Mensualidades", total: 500, due: "2026-09-05" },
        { id: "m3", studentId: "b", category: "Mensualidades", total: 500, due: "2026-10-02" },
        { id: "p1", studentId: "a", category: "Pedidos", total: 300, due: "2026-10-01" },
        { id: "e1", studentId: "a", category: "Exámenes", total: 200, due: "2026-10-01" },
      ],
      payments: [
        { id: "x1", chargeId: "m3", date: "2026-10-02", amount: 500, valid: true },
        { id: "x2", chargeId: "p1", date: "2026-10-01", amount: 300, valid: true },
        { id: "x3", chargeId: "e1", date: "2026-10-01", amount: 200, valid: true },
      ],
    } as unknown as Bootstrap;
    expect(paymentsSummary(data)).toMatchObject({
      monthly: 500,
      orders: 300,
      exams: 200,
      toCollect: 500,
      previous: 500,
    });
  });
});
