import { useMemo, useState, type ReactNode } from "react";
import type { Bootstrap, Order } from "../../../shared/api/contracts";
import { money } from "../../../shared/lib/format";
import { paths } from "../../../shared/lib/paths";
import { Link } from "../../../shared/ui/Link";
import { Money } from "../../../shared/ui/Money";
import { Empty } from "../../../shared/ui/PageHeader";

const isDelivered = (order: Order) =>
  order.items.filter((item) => !item.cancelled).every((item) => item.delivered >= item.quantity);

/** Historial de pedidos: quién pidió qué, si ya pagó y si ya se le entregó. */
export function OrdersTable({ data, action }: { data: Bootstrap; action?: ReactNode }) {
  const [query, setQuery] = useState("");
  const [pendingOnly, setPendingOnly] = useState(false);
  const nameOf = (id: string) => data.students.find((student) => student.id === id)?.name ?? "";
  const rows = useMemo(() => {
    const text = query.trim().toLocaleLowerCase("es");
    return data.orders.filter(
      (order) =>
        (!pendingOnly || !isDelivered(order)) &&
        (!text ||
          nameOf(order.studentId).toLocaleLowerCase("es").includes(text) ||
          order.items.some((item) => item.name.toLocaleLowerCase("es").includes(text))),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.orders, data.students, query, pendingOnly]);

  return (
    <>
      <div className="toolbar">
        <div className="field grow">
          <label htmlFor="order-search">Buscar alumno o artículo</label>
          <input
            id="order-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={pendingOnly}
            onChange={(event) => setPendingOnly(event.target.checked)}
          />
          Solo por entregar
        </label>
        {action && <div className="toolbar-action">{action}</div>}
      </div>
      <section className="table-surface table-wrap spacer-top">
        {rows.length ? (
          <table className="financial-table">
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Artículos</th>
                <th className="num">Total</th>
                <th>Pago</th>
                <th>Entrega</th>
                <th>
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((order) => {
                const owed = order.total - order.paid;
                return (
                  <tr key={order.id}>
                    <td className="primary-cell">
                      <strong>{nameOf(order.studentId)}</strong>
                      <span>{order.id}</span>
                    </td>
                    <td>
                      {order.items
                        .map(
                          (item) =>
                            `${item.quantity} × ${item.name}${item.size ? ` (${item.size})` : ""}`,
                        )
                        .join(", ")}
                    </td>
                    <td className="num">
                      <Money value={order.total} />
                    </td>
                    <td>
                      {owed > 0 ? (
                        <span className="badge warning">{`Debe ${money(owed)}`}</span>
                      ) : (
                        <span className="badge success">Pagado</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${isDelivered(order) ? "success" : "light"}`}>
                        {isDelivered(order) ? "Entregado" : "Por entregar"}
                      </span>
                    </td>
                    <td>
                      <div className="inline-actions">
                        {owed > 0 && (
                          <Link
                            className="button small"
                            to={paths.pagoNuevo(undefined, order.studentId)}
                          >
                            Registrar pago
                          </Link>
                        )}
                        <Link className="button secondary small" to={paths.pedido(order.uuid)}>
                          Ver detalle
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <Empty
            title={data.orders.length ? "Sin coincidencias" : "Sin pedidos"}
            text={
              data.orders.length
                ? "Cambia la búsqueda o el filtro."
                : "Todavía no se han registrado pedidos."
            }
          />
        )}
      </section>
    </>
  );
}
