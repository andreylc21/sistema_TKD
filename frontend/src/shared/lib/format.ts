export const money = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(value);
export const date = (value: string) => {
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "Fecha no válida";
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric" })
    .format(parsed)
    .replace(".", "");
};
export const paidFor = (
  chargeId: string,
  payments: { chargeId: string; amount: number; valid: boolean }[],
) =>
  payments.filter((p) => p.chargeId === chargeId && p.valid).reduce((sum, p) => sum + p.amount, 0);

export type PaymentProgress = "Sin pagos" | "Pago parcial" | "Pagado";
export type DueStatus = "Pendiente" | "Próximo a pagar" | "Vence hoy" | "Vencido";

export function paymentProgress(total: number, received: number): PaymentProgress {
  if (received >= total) return "Pagado";
  if (received > 0) return "Pago parcial";
  return "Sin pagos";
}

export function dueStatus(dueDate: string, today: string, balance: number): DueStatus | null {
  if (balance <= 0) return null;
  const dayInMilliseconds = 86_400_000;
  const due = Date.parse(`${dueDate}T12:00:00Z`);
  const reference = Date.parse(`${today}T12:00:00Z`);
  const daysUntilDue = Math.round((due - reference) / dayInMilliseconds);
  if (daysUntilDue < 0) return "Vencido";
  if (daysUntilDue === 0) return "Vence hoy";
  if (daysUntilDue <= 5) return "Próximo a pagar";
  return "Pendiente";
}
