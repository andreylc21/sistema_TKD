import type { Bootstrap, Order } from "../../../shared/api/contracts";
import { money } from "../../../shared/lib/format";
import { Empty } from "../../../shared/ui/PageHeader";

export function OrdersTable({
  data,
  onSelect,
}: {
  data: Bootstrap;
  onSelect: (order: Order) => void;
}) {
  return (
    <section className="card">
      {data.orders.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pedido / alumno</th>
                <th>Artículos</th>
                <th>Total</th>
                <th>Saldo</th>
                <th>
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((order) => (
                <tr key={order.id}>
                  <td className="primary-cell">
                    <strong>{order.id}</strong>
                    <span>
                      {data.students.find((student) => student.id === order.studentId)?.name}
                    </span>
                  </td>
                  <td>{order.items.map((item) => `${item.quantity} × ${item.name}`).join(", ")}</td>
                  <td>{money(order.total)}</td>
                  <td>{money(order.total - order.paid)}</td>
                  <td>
                    <button className="button secondary small" onClick={() => onSelect(order)}>
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty title="Sin pedidos" text="Todavía no se han registrado pedidos." />
      )}
    </section>
  );
}
