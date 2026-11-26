import type { ReactNode } from "react";

export type StatusTone = "neutral" | "warning" | "success" | "danger";

/** Estado como etiqueta suave: fondo claro del color y texto oscuro del mismo color, sin borde. */
export function Status({ tone = "neutral", children }: { tone?: StatusTone; children: ReactNode }) {
  return <span className={`status status-${tone}`}>{children}</span>;
}
