import type { ChangeEvent, ReactNode } from "react";

/** Selector de filtro de una lista, con su etiqueta. Las opciones van como `<option>`. */
export function FilterSelect({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  children: ReactNode;
}) {
  return (
    <div className="field compact">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={onChange}>
        {children}
      </select>
    </div>
  );
}
