import type { Bootstrap } from "../../../shared/api/contracts";
import { paths } from "../../../shared/lib/paths";
import { Link } from "../../../shared/ui/Link";
import { Money } from "../../../shared/ui/Money";
import { Empty } from "../../../shared/ui/PageHeader";

export function OrdersTable({ data }: { data: Bootstrap }) {
  return (
    <section className="table-surface table-wrap">
      {data.orders.length ? (
        <table className="financial-table">
          <thead>
            <tr>
              <th>Pedido / alumno</th>
              <th>Artículos</th>
              <th className="num">Total</th>
              <th className="num">Saldo</th>
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
                <td className="num">
                  <Money value={order.total} />
                </td>
                <td className="num">
                  <strong>
                    <Money value={order.total - order.paid} />
                  </strong>
                </td>
                <td>
                  <Link className="button secondary small" to={paths.pedido(order.uuid)}>
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <Empty title="Sin pedidos" text="Todavía no se han registrado pedidos." />
      )}
    </section>
  );
}
