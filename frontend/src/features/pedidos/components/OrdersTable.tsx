import { useMemo, useState, type ReactNode } from "react";
import type { Bootstrap, Order } from "../../../shared/api/contracts";
import { ConfirmAction } from "../../../shared/ui/ConfirmAction";
import { DataTable } from "../../../shared/ui/DataTable";
import { ListTools } from "../../../shared/ui/ListTools";
import { Money } from "../../../shared/ui/Money";
import { Status } from "../../../shared/ui/Status";
import { Tabs } from "../../../shared/ui/Tabs";
import { deliverOrder } from "../../pagos/api/pagos.api";

const activeItems = (order: Order) => order.items.filter((item) => !item.cancelled);

const isDelivered = (order: Order) =>
  activeItems(order).every((item) => item.delivered >= item.quantity);

/**
 * Pedidos: se pagan y se entregan completos. En curso = por entregar; Historial = entregados.
 * "Entregar" marca todo el pedido de una vez, sin seguimiento artículo por artículo.
 */
export function OrdersTable({
  data,
  reload,
  action,
}: {
  data: Bootstrap;
  reload: () => Promise<void>;
  action?: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const nameOf = (id: string) => data.students.find((student) => student.id === id)?.name ?? "";
  const rows = useMemo(() => {
    const text = query.trim().toLocaleLowerCase("es");
    return data.orders.filter(
      (order) =>
        !isDelivered(order) === (tab === "pending") &&
        (!text ||
          nameOf(order.studentId).toLocaleLowerCase("es").includes(text) ||
          order.items.some((item) => item.name.toLocaleLowerCase("es").includes(text))),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.orders, data.students, query, tab]);

  return (
    <>
      <Tabs
        label="Pedidos"
        value={tab}
        onChange={setTab}
        items={[
          { id: "pending", label: "En curso" },
          { id: "history", label: "Historial" },
        ]}
        action={action}
      />
      <ListTools
        searchId="order-search"
        searchLabel="Buscar alumno o artículo"
        query={query}
        onQuery={(event) => setQuery(event.target.value)}
      />
      <DataTable
        rows={rows}
        rowKey={(order) => order.id}
        empty={{
          title:
            data.orders.length && query
              ? "Sin coincidencias"
              : tab === "pending"
                ? "Nada en curso"
                : "Sin historial todavía",
          text:
            data.orders.length && query
              ? "Cambia la búsqueda."
              : tab === "pending"
                ? "Todos los pedidos están entregados."
                : "Aquí aparecen los pedidos ya entregados.",
        }}
        columns={[
          {
            header: "Alumno",
            primary: true,
            cell: (order) => (
              <>
                <strong>{nameOf(order.studentId)}</strong>
                <span>{order.id}</span>
              </>
            ),
          },
          {
            header: "Artículos",
            cell: (order) =>
              activeItems(order).map((item) => (
                <div className="item-line" key={item.id}>
                  {item.name}
                </div>
              )),
          },
          {
            header: "Unidades",
            cell: (order) =>
              activeItems(order).map((item) => (
                <div className="item-line" key={item.id}>
                  {item.quantity}
                </div>
              )),
          },
          {
            header: "Precio",
            cell: (order) =>
              activeItems(order).map((item) => (
                <div className="item-line" key={item.id}>
                  <Money value={item.price} />
                </div>
              )),
          },
          { header: "Total", cell: (order) => <Money value={order.total} /> },
          {
            header: "Estado",
            cell: (order) =>
              isDelivered(order) ? (
                <Status tone="success">Entregado</Status>
              ) : (
                <Status tone="warning">Por entregar</Status>
              ),
          },
          {
            header: "Acciones",
            actions: true,
            cell: (order) =>
              !isDelivered(order) && (
                <ConfirmAction
                  label="Entregar"
                  title="Entregar pedido"
                  className="button success small"
                  onConfirm={async () => {
                    await deliverOrder(order.uuid);
                    await reload();
                  }}
                >
                  ¿Marcar como entregado el pedido {order.id} de {nameOf(order.studentId)}? Se
                  entrega todo junto.
                </ConfirmAction>
              ),
          },
        ]}
      />
    </>
  );
}
