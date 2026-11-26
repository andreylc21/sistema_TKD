import type { ChangeEvent } from "react";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

/** Campo de búsqueda con lupa: mismo aspecto en todas las listas. */
export function SearchInput({ id, label, value, onChange }: Props) {
  return (
    <div className="field grow">
      <label htmlFor={id}>{label}</label>
      <div className="search-box">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.6-3.6" />
        </svg>
        <input id={id} type="search" value={value} onChange={onChange} />
      </div>
    </div>
  );
}
