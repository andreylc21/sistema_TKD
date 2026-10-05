import { describe, expect, it } from "vitest";
import type { Bootstrap, Charge, Payment } from "../../../shared/api/contracts";
import { chargePresentation, orderItemPending } from "./pagos.model";

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
