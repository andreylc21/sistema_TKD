import type { ChangeEvent, ReactNode } from "react";
import { SearchInput } from "./SearchInput";

/** Barra de una lista: buscador con lupa, filtros opcionales y la acción principal a la derecha. */
export function ListTools({
  searchId,
  searchLabel,
  query,
  onQuery,
  filters,
  action,
}: {
  searchId: string;
  searchLabel: string;
  query: string;
  onQuery: (event: ChangeEvent<HTMLInputElement>) => void;
  filters?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="list-tools">
      <SearchInput id={searchId} label={searchLabel} value={query} onChange={onQuery} />
      {filters}
      {action && <div className="list-tools-action">{action}</div>}
    </div>
  );
}
