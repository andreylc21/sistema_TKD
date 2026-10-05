import { useState } from "react";
import type { Bootstrap, Order } from "../../shared/api/contracts";
import { Dialog } from "../../shared/ui/Dialog";
import { Notice, PageHeader } from "../../shared/ui/PageHeader";
import { ChargesOverview } from "./components/ChargesView";
import { OrderDetail } from "./components/OrderDetail";
import { OrderForm } from "./components/OrderForm";
import { OrdersTable } from "./components/OrdersTable";
import { PaymentForm } from "./components/PaymentForm";
import { PaymentHistory } from "./PaymentHistory";
import { getPendingCharges } from "./model/pagos.model";

export type PaymentsTab = "cobros" | "saldos" | "pedidos";
export type PaymentsTarget = {
  tab?: PaymentsTab;
  chargeId?: string;
  orderId?: string;
  due?: "Vencido" | "Próximo a pagar" | "Vence hoy" | "Pendiente" | "Por vencer";
};
type DialogName = "payment" | "order" | null;

const tabs: { id: PaymentsTab; label: string }[] = [
  { id: "cobros", label: "Cobros y pagos" },
  { id: "saldos", label: "Saldos pendientes" },
  { id: "pedidos", label: "Pedidos" },
];

export function PagosPage({
  data,
  reload,
  initialTarget,
}: {
  data: Bootstrap;
  reload: () => Promise<void>;
  initialTarget?: PaymentsTarget;
}) {
  const [tab, setTab] = useState<PaymentsTab>(initialTarget?.tab ?? "cobros");
  const [dialog, setDialog] = useState<DialogName>(initialTarget?.chargeId ? "payment" : null);
  const [selectedChargeId, setSelectedChargeId] = useState(initialTarget?.chargeId);
  const [message, setMessage] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(
    () =>
      data.orders.find(
        (order) => order.uuid === initialTarget?.orderId || order.id === initialTarget?.orderId,
      ) ?? null,
  );
  const pendingCharges = getPendingCharges(data);

  if (selectedOrder) {
    return (
      <OrderDetail
        data={data}
        order={selectedOrder}
        reload={reload}
        onBack={() => setSelectedOrder(null)}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Pagos"
        help="Consulta cada cargo con su avance y vencimiento; los pagos y la logística de pedidos conservan estados independientes."
        actions={
          <button
            className="button"
            onClick={() => {
              setSelectedChargeId(undefined);
              setDialog(tab === "pedidos" ? "order" : "payment");
            }}
          >
            {tab === "pedidos" ? "Registrar pedido" : "Registrar pago"}
          </button>
        }
      />
      {message && <Notice>{message}</Notice>}
      <div className="tabs" role="tablist" aria-label="Secciones de pagos">
        {tabs.map((item) => (
          <button
            key={item.id}
            id={`tab-${item.id}`}
            className="tab"
            role="tab"
            aria-selected={tab === item.id}
            aria-controls={`panel-${item.id}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === "cobros" && (
          <>
            <ChargesOverview
              data={data}
              onPayment={(charge) => {
                setSelectedChargeId(charge.id);
                setDialog("payment");
              }}
            />
            <PaymentHistory data={data} reload={reload} />
          </>
        )}
        {tab === "saldos" && (
          <ChargesOverview
            data={{ ...data, charges: pendingCharges }}
            initialDue={initialTarget?.due ?? ""}
            onPayment={(charge) => {
              setSelectedChargeId(charge.id);
              setDialog("payment");
            }}
          />
        )}
        {tab === "pedidos" && <OrdersTable data={data} onSelect={setSelectedOrder} />}
      </div>
      {dialog === "payment" && (
        <Dialog title="Registrar pago manual" onClose={() => setDialog(null)}>
          <PaymentForm
            data={data}
            charges={pendingCharges}
            initialChargeId={selectedChargeId}
            onCancel={() => setDialog(null)}
            onSaved={async () => {
              await reload();
              setDialog(null);
              setMessage("Pago registrado; saldo y estados actualizados.");
            }}
          />
        </Dialog>
      )}
      {dialog === "order" && (
        <Dialog title="Registrar pedido" onClose={() => setDialog(null)}>
          <OrderForm
            data={data}
            onCancel={() => setDialog(null)}
            onSaved={async () => {
              setDialog(null);
              await reload();
            }}
          />
        </Dialog>
      )}
    </>
  );
}
