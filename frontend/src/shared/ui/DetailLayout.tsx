import type { ReactNode } from "react";

/**
 * Distribución de una ficha.
 * - "sidebar": `main` a la izquierda (doble de ancho) y `side` a la derecha, con sus tarjetas
 *   repartiéndose la altura de `main` y desplazándose por dentro.
 * - "columns": `main` y `side` en dos columnas iguales y `wide` a todo lo ancho debajo.
 */
export function DetailLayout({
  variant = "sidebar",
  main,
  side,
  wide,
}: {
  variant?: "sidebar" | "columns";
  main: ReactNode;
  side?: ReactNode;
  wide?: ReactNode;
}) {
  if (variant === "columns")
    return (
      <div className="detail-columns">
        {main}
        {side}
        {wide && <div className="detail-wide">{wide}</div>}
      </div>
    );
  return (
    <div className="detail-layout">
      {main}
      {side && <div className="detail-side">{side}</div>}
    </div>
  );
}
