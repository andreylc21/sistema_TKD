import type { ReactNode } from "react";

/** Tarjeta de una cifra: etiqueta, valor grande y una nota (por ejemplo el cambio contra el mes anterior). */
export function StatCard({
  label,
  value,
  note,
  trend,
}: {
  label: ReactNode;
  value: ReactNode;
  note?: ReactNode;
  /** Colorea la nota: sube (verde), baja (rojo) o sin color. */
  trend?: "up" | "down";
}) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {note && <span className={`stat-note${trend ? ` stat-${trend}` : ""}`}>{note}</span>}
    </div>
  );
}
