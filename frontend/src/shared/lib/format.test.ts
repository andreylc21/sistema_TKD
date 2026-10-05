import { describe, expect, it } from "vitest";
import { date, dueStatus, paidFor, paymentProgress } from "./format";

describe("dueStatus", () => {
  it("marks an unpaid past charge as overdue", () => {
    expect(dueStatus("2026-10-02", "2026-10-03", 100)).toBe("Vencido");
  });

  it("marks a charge due within five days as upcoming", () => {
    expect(dueStatus("2026-10-08", "2026-10-03", 100)).toBe("Próximo a pagar");
  });

  it("distinguishes a charge due today", () => {
    expect(dueStatus("2026-10-03", "2026-10-03", 100)).toBe("Vence hoy");
  });

  it("does not retain a due alert after full payment", () => {
    expect(dueStatus("2026-09-01", "2026-10-03", 0)).toBeNull();
  });
});

describe("paymentProgress", () => {
  it("distinguishes no payments, a partial payment and full payment", () => {
    expect(paymentProgress(600, 0)).toBe("Sin pagos");
    expect(paymentProgress(600, 400)).toBe("Pago parcial");
    expect(paymentProgress(600, 600)).toBe("Pagado");
  });
});

describe("paidFor", () => {
  it("sums only valid payments assigned to the charge", () => {
    expect(
      paidFor("charge-1", [
        { chargeId: "charge-1", amount: 400, valid: true },
        { chargeId: "charge-1", amount: 200, valid: false },
        { chargeId: "charge-2", amount: 100, valid: true },
      ]),
    ).toBe(400);
  });
});

describe("date", () => {
  it("does not throw for an empty or incomplete value", () => {
    expect(date("")).toBe("Fecha no válida");
    expect(date("2026-1")).toBe("Fecha no válida");
  });
});
