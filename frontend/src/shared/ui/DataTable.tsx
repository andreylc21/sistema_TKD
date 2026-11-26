import type { ReactNode } from "react";
import { Empty } from "./PageHeader";

export type Column<T> = {
  /** Encabezado; vacío para la columna de acciones (queda solo para lectores de pantalla). */
  header: string;
  cell: (row: T) => ReactNode;
  /** Primera columna con nombre en negritas y detalles debajo. */
  primary?: boolean;
  /** La columna solo trae botones. */
  actions?: boolean;
};

/** Tabla de lista: columnas declaradas una vez, filas y estado vacío incluidos. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowClassName,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  rowClassName?: (row: T) => string | undefined;
  empty: { title: string; text: string };
}) {
  return (
    <div className="table-surface">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={index}>
                  {column.actions ? (
                    <span className="sr-only">{column.header}</span>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className={rowClassName?.(row)}>
                {columns.map((column, index) => (
                  <td key={index} className={column.primary ? "primary-cell" : undefined}>
                    {column.actions ? (
                      <div className="inline-actions">{column.cell(row)}</div>
                    ) : (
                      column.cell(row)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <Empty title={empty.title} text={empty.text} />}
    </div>
  );
}
