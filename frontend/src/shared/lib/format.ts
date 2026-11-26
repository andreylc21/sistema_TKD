export const money = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(value);
/**
 * Estándar de fechas del sistema:
 * - `date`: toda fecha dentro del contenido ("05/10/2026").
 * - `dateLong`: solo la barra superior ("Lunes 5 de octubre de 2026").
 * - `monthLabel` (reportes): un mes completo ("Octubre 2026").
 * Los campos de captura usan el selector nativo del navegador.
 */
export const date = (value: string) => {
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "Fecha no válida";
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
};
/** Fecha completa para la barra superior: "Lunes 5 de octubre de 2026". */
export const dateLong = (value: string) => {
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "Fecha no válida";
  const text = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(parsed)
    .replace(",", "");
  return text.charAt(0).toUpperCase() + text.slice(1);
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
/**
 * Los conceptos llegan con fechas en ISO: "Mensualidad 2026-10" se muestra como "Mensualidad octubre 2026"
 * y "Examen parcial · 2026-10-16" como "Examen parcial · 16/10/2026".
 */
export const conceptLabel = (concept: string) => {
  const full = /^(.*?)(\d{4}-\d{2}-\d{2})$/.exec(concept);
  if (full) return `${full[1]}${date(full[2])}`;
  const match = /^(.*?)(\d{4})-(\d{2})$/.exec(concept);
  if (!match) return concept;
  const month = new Intl.DateTimeFormat("es-MX", { month: "long" }).format(
    new Date(`${match[2]}-${match[3]}-01T12:00:00`),
  );
  return `${match[1]}${month} ${match[2]}`;
};
