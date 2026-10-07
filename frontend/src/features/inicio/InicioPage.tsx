import type { ReactNode } from "react";
import type { Bootstrap, Charge, Order } from "../../shared/api/contracts";
import { date } from "../../shared/lib/format";
import { paths } from "../../shared/lib/paths";
import { Link } from "../../shared/ui/Link";
import { Metric, Money } from "../../shared/ui/Money";
import { PageHeader } from "../../shared/ui/PageHeader";
import { chargePresentation, orderItemPending } from "../pagos/model/pagos.model";

export function InicioPage({ data }: { data: Bootstrap }) {
  const today = data.sessions
    .filter((session) => session.date === data.demoDate && session.status !== "Cancelada")
    .sort((left, right) => left.time.localeCompare(right.time));
  const pending = data.charges
    .map((charge) => ({ charge, state: chargePresentation(charge, data) }))
    .filter(({ state }) => state.balance > 0);
  const overdue = pending.filter(({ state }) => state.due === "Vencido");
  const upcoming = pending.filter(
    ({ state }) => state.due === "Próximo a pagar" || state.due === "Vence hoy",
  );
  const openOrders = data.orders.filter((order) =>
    order.items.some(
      (item) =>
        !item.cancelled &&
        (orderItemPending(item).receive > 0 || orderItemPending(item).deliver > 0),
    ),
  );

  return (
    <>
      <PageHeader
        help="Muestra prioridades operativas y accesos directos a la clase, cargo, pedido o expediente correspondiente."
        context={`Fecha operativa: ${date(data.demoDate)}`}
      />
      <div className="summary-strip">
        <Metric label="Clases de hoy">{today.length}</Metric>
        <Metric label="Cargos vencidos">{overdue.length}</Metric>
        <Metric label="Próximos a pagar">{upcoming.length}</Metric>
        <Metric label="Pedidos por completar">{openOrders.length}</Metric>
      </div>
      <div className="dashboard-grid spacer-top">
        <PriorityList
          title="Clases del día"
          empty="Sin clases programadas para hoy."
          action={
            <Link className="text-button" to={paths.clases()}>
              Ver clases por fecha
            </Link>
          }
        >
          {today.slice(0, 4).map((session) => {
            const group = data.groups.find((item) => item.id === session.groupId);
            return (
              <li className="list-row" key={session.id}>
                <div className="list-row-main">
                  <strong>{group?.name ?? "Grupo no disponible"}</strong>
                  <span>
                    {session.time} · {session.status} · Participantes: {session.attendance.length}
                  </span>
                </div>
                <Link className="button secondary small" to={paths.sesion(session.id)}>
                  Abrir clase
                </Link>
              </li>
            );
          })}
        </PriorityList>
        <PriorityList
          title="Cargos vencidos"
          empty="No hay cargos vencidos."
          action={
            <Link className="text-button" to={paths.pagos("saldos", "Vencido")}>
              Ver todos
            </Link>
          }
        >
          {overdue.slice(0, 4).map(({ charge, state }) => (
            <ChargeRow key={charge.id} data={data} charge={charge} balance={state.balance} />
          ))}
        </PriorityList>
        <PriorityList
          title="Próximos a pagar"
          empty="No hay cargos próximos."
          action={
            <Link className="text-button" to={paths.pagos("saldos", "Por vencer")}>
              Ver todos
            </Link>
          }
        >
          {upcoming.slice(0, 4).map(({ charge, state }) => (
            <ChargeRow key={charge.id} data={data} charge={charge} balance={state.balance} />
          ))}
        </PriorityList>
        <PriorityList
          title="Pedidos por completar"
          empty="No hay recepciones ni entregas pendientes."
          action={
            <Link className="text-button" to={paths.pagos("pedidos")}>
              Revisar pedidos
            </Link>
          }
        >
          {openOrders.slice(0, 4).map((order) => (
            <OrderRow key={order.id} data={data} order={order} />
          ))}
        </PriorityList>
      </div>
    </>
  );
}

function PriorityList({
  title,
  empty,
  action,
  children,
}: {
  title: string;
  empty: string;
  action: ReactNode;
  children: ReactNode;
}) {
  const hasItems = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <section className="operational-list">
      <header>
        <h2>{title}</h2>
        {action}
      </header>
      {hasItems ? <ul className="list">{children}</ul> : <p className="empty-inline">{empty}</p>}
    </section>
  );
}
function ChargeRow({
  data,
  charge,
  balance,
}: {
  data: Bootstrap;
  charge: Charge;
  balance: number;
}) {
  const student = data.students.find((item) => item.id === charge.studentId);
  return (
    <li className="list-row">
      <div className="list-row-main">
        <Link className="text-button align-start" to={paths.alumno(charge.studentId)}>
          {student?.name ?? "Alumno no disponible"}
        </Link>
        <span>
          {charge.concept} · {date(charge.due)} · Saldo <Money value={balance} />
        </span>
      </div>
      <Link className="button secondary small" to={paths.pagoNuevo("saldos", charge.id)}>
        Registrar pago
      </Link>
    </li>
  );
}
function OrderRow({ data, order }: { data: Bootstrap; order: Order }) {
  const student = data.students.find((item) => item.id === order.studentId);
  const receive = order.items.reduce(
    (sum, item) => sum + (item.cancelled ? 0 : orderItemPending(item).receive),
    0,
  );
  const deliver = order.items.reduce(
    (sum, item) => sum + (item.cancelled ? 0 : orderItemPending(item).deliver),
    0,
  );
  return (
    <li className="list-row">
      <div className="list-row-main">
        <strong>
          Pedido {order.id} · {student?.name}
        </strong>
        <span>
          Por recibir: {receive} · Por entregar: {deliver}
        </span>
      </div>
      <Link className="button secondary small" to={paths.pedido(order.uuid)}>
        Abrir pedido
      </Link>
    </li>
  );
}
