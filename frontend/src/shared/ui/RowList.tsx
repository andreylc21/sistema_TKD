import type { ReactNode } from "react";
import { Empty } from "./PageHeader";

export type RowItem = {
  id: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Dato breve a la derecha (un estado, una fecha). */
  value?: ReactNode;
  /** Botones a la derecha de la fila. */
  actions?: ReactNode;
};

/** Lista de filas con título, detalle y acciones; con estado vacío. Va dentro de una `Card`. */
export function RowList({
  items,
  empty,
}: {
  items: RowItem[];
  empty: { title: string; text: string };
}) {
  if (!items.length) return <Empty title={empty.title} text={empty.text} />;
  return (
    <ul className="list">
      {items.map((item) => (
        <li className="list-row" key={item.id}>
          <div className="list-row-main">
            <strong>{item.title}</strong>
            {item.subtitle && <span>{item.subtitle}</span>}
          </div>
          {item.value && <div className="list-row-value">{item.value}</div>}
          {item.actions && <div className="inline-actions">{item.actions}</div>}
        </li>
      ))}
    </ul>
  );
}
