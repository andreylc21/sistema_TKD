import type { ReactNode } from "react";

/** Franja de cifras: cada `SummaryItem` lleva una etiqueta, un valor y, opcional, una nota. */
export function SummaryStrip({
  compact = false,
  className = "",
  children,
}: {
  compact?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`summary-strip${compact ? " compact" : ""} ${className}`.trim()}>
      {children}
    </div>
  );
}

export function SummaryItem({
  label,
  note,
  children,
}: {
  label: ReactNode;
  note?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="summary-item">
      <span>{label}</span>
      <strong>{children}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}
