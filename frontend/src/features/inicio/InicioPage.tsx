import type { ReactNode } from "react";
import type { Bootstrap, Charge, Order, Session } from "../../shared/api/contracts";
import { date, money } from "../../shared/lib/format";
import { PageHeader } from "../../shared/ui/PageHeader";
import { chargePresentation, orderItemPending } from "../pagos/model/pagos.model";
import type { PaymentsTarget } from "../pagos/PagosPage";

export function InicioPage({
  data,
  onClass,
  onClasses,
  onPayments,
  onStudent,
}: {
  data: Bootstrap;
  onClass: (session: Session) => void;
  onClasses: () => void;
  onPayments: (target: PaymentsTarget) => void;
  onStudent: (studentId: string) => void;
}) {
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
        title="Inicio"
        help="Muestra prioridades operativas y accesos directos a la clase, cargo, pedido o expediente correspondiente."
        context={`Fecha operativa: ${date(data.demoDate)}`}
      />
      <div className="summary-strip">
        <Count label="Clases de hoy" value={today.length} />
        <Count label="Cargos vencidos" value={overdue.length} />
        <Count label="Próximos a pagar" value={upcoming.length} />
        <Count label="Pedidos por completar" value={openOrders.length} />
      </div>
      <div className="dashboard-grid spacer-top">
        <PriorityList
          title="Clases del día"
          empty="Sin clases programadas para hoy."
          action={
            <button className="text-button" onClick={onClasses}>
              Ver clases por fecha
            </button>
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
                <button className="button secondary small" onClick={() => onClass(session)}>
                  Abrir clase
                </button>
              </li>
            );
          })}
        </PriorityList>
        <PriorityList
          title="Cargos vencidos"
          empty="No hay cargos vencidos."
          action={
            <button
              className="text-button"
              onClick={() => onPayments({ tab: "saldos", due: "Vencido" })}
            >
              Ver todos
            </button>
          }
        >
          {overdue.slice(0, 4).map(({ charge, state }) => (
            <ChargeRow
              key={charge.id}
              data={data}
              charge={charge}
              balance={state.balance}
              onPayment={() => onPayments({ tab: "saldos", chargeId: charge.id })}
              onStudent={onStudent}
            />
          ))}
        </PriorityList>
        <PriorityList
          title="Próximos a pagar"
          empty="No hay cargos próximos."
          action={
            <button
              className="text-button"
              onClick={() => onPayments({ tab: "saldos", due: "Por vencer" })}
            >
              Ver todos
            </button>
          }
        >
          {upcoming.slice(0, 4).map(({ charge, state }) => (
            <ChargeRow
              key={charge.id}
              data={data}
              charge={charge}
              balance={state.balance}
              onPayment={() => onPayments({ tab: "saldos", chargeId: charge.id })}
              onStudent={onStudent}
            />
          ))}
        </PriorityList>
        <PriorityList
          title="Pedidos por completar"
          empty="No hay recepciones ni entregas pendientes."
          action={
            <button className="text-button" onClick={() => onPayments({ tab: "pedidos" })}>
              Revisar pedidos
            </button>
          }
        >
          {openOrders.slice(0, 4).map((order) => (
            <OrderRow
              key={order.id}
              data={data}
              order={order}
              onOpen={() => onPayments({ tab: "pedidos", orderId: order.uuid })}
            />
          ))}
        </PriorityList>
      </div>
    </>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="summary-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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
  onPayment,
  onStudent,
}: {
  data: Bootstrap;
  charge: Charge;
  balance: number;
  onPayment: () => void;
  onStudent: (id: string) => void;
}) {
  const student = data.students.find((item) => item.id === charge.studentId);
  return (
    <li className="list-row">
      <div className="list-row-main">
        <button className="text-button align-start" onClick={() => onStudent(charge.studentId)}>
          {student?.name ?? "Alumno no disponible"}
        </button>
        <span>
          {charge.concept} · {date(charge.due)} · Saldo {money(balance)}
        </span>
      </div>
      <button className="button secondary small" onClick={onPayment}>
        Registrar pago
      </button>
    </li>
  );
}
function OrderRow({ data, order, onOpen }: { data: Bootstrap; order: Order; onOpen: () => void }) {
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
      <button className="button secondary small" onClick={onOpen}>
        Abrir pedido
      </button>
    </li>
  );
}
