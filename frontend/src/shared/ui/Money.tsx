import type { ReactNode } from "react";
import { money } from "../lib/format";

/** Importe con cifras de ancho fijo y sin saltos de línea. En tablas, su columna usa `num`. */
export function Money({ value }: { value: number }) {
  return <span className="money">{money(value)}</span>;
}

/** Dato de una franja de resumen: etiqueta arriba y valor destacado debajo. */
export function Metric({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="summary-item">
      <span>{label}</span>
      <strong>{children}</strong>
    </div>
  );
}
