import type { ReactNode } from "react";

/** Pestañas a la izquierda y, a la derecha, la acción principal de la pantalla. */
export function Tabs<T extends string>({
  label,
  items,
  value,
  onChange,
  action,
}: {
  label: string;
  items: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  action?: ReactNode;
}) {
  return (
    <div className="tabs-row">
      <div className="tabs" role="tablist" aria-label={label}>
        {items.map((item) => (
          <button
            key={item.id}
            className="tab"
            role="tab"
            aria-selected={value === item.id}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {action}
    </div>
  );
}
