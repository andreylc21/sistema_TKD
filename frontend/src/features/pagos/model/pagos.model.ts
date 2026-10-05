import type { Bootstrap, Charge } from "../../../shared/api/contracts";
import {
  dueStatus,
  paidFor,
  paymentProgress,
  type DueStatus,
  type PaymentProgress,
} from "../../../shared/lib/format";
import type { PaymentsTab } from "../../../shared/lib/paths";

export const paymentsTabs: { id: PaymentsTab; label: string }[] = [
  { id: "cobros", label: "Cobros y pagos" },
  { id: "saldos", label: "Saldos pendientes" },
  { id: "pedidos", label: "Pedidos" },
];

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
