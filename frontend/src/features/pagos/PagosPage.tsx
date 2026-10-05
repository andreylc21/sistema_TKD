import type { Bootstrap } from "../../shared/api/contracts";
import type { DueStatus } from "../../shared/lib/format";
import { goBack, navigate } from "../../shared/lib/navigation";
import { paths, type PaymentsTab } from "../../shared/lib/paths";
import { FormScreen } from "../../shared/ui/FormScreen";
import { Link } from "../../shared/ui/Link";
import { PageHeader } from "../../shared/ui/PageHeader";
import { ChargesOverview } from "./components/ChargesView";
import { OrderForm } from "./components/OrderForm";
import { OrdersTable } from "./components/OrdersTable";
import { PaymentForm } from "./components/PaymentForm";
import { PaymentHistory } from "./PaymentHistory";
import { getPendingCharges, paymentsTabs } from "./model/pagos.model";

type DueFilter = DueStatus | "Por vencer" | "";
type PaymentTab = Exclude<PaymentsTab, "pedidos">;

const dueFilters: DueFilter[] = [
  "Por vencer",
  "Pendiente",
  "Próximo a pagar",
  "Vence hoy",
  "Vencido",
];

export function PagosPage({
  data,
  reload,
  tab,
  due,
}: {
  data: Bootstrap;
  reload: () => Promise<void>;
  tab: PaymentsTab;
  due?: string;
}) {
  const pendingCharges = getPendingCharges(data);
  const initialDue = dueFilters.find((item) => item === due) ?? "";
  const paymentTab: PaymentTab = tab === "saldos" ? "saldos" : "cobros";

  return (
    <>
      <PageHeader
        help="Consulta cada cargo con su avance y vencimiento; los pagos y la logística de pedidos conservan estados independientes."
        actions={
          tab === "pedidos" ? (
            <Link className="button" to={paths.pedidoNuevo}>
              Registrar pedido
            </Link>
          ) : (
            <Link className="button" to={paths.pagoNuevo(paymentTab)}>
              Registrar pago
            </Link>
          )
        }
      />
      <div className="tabs" role="tablist" aria-label="Secciones de pagos">
        {paymentsTabs.map((item) => (
          <button
            key={item.id}
            id={`tab-${item.id}`}
            className="tab"
            role="tab"
            aria-selected={tab === item.id}
            aria-controls={`panel-${item.id}`}
            onClick={() => navigate(paths.pagos(item.id), { replace: true })}
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
              paymentLink={(charge) => paths.pagoNuevo("cobros", charge.id)}
            />
            <PaymentHistory data={data} reload={reload} />
          </>
        )}
        {tab === "saldos" && (
          <ChargesOverview
            key={initialDue}
            data={{ ...data, charges: pendingCharges }}
            initialDue={initialDue}
            paymentLink={(charge) => paths.pagoNuevo("saldos", charge.id)}
          />
        )}
        {tab === "pedidos" && <OrdersTable data={data} />}
      </div>
    </>
  );
}

export function PaymentPage({
  data,
  tab,
  chargeId,
  reload,
}: {
  data: Bootstrap;
  tab: PaymentTab;
  chargeId?: string;
  reload: () => Promise<void>;
}) {
  const parent = paths.pagos(tab);
  return (
    <FormScreen>
      <PaymentForm
        data={data}
        charges={getPendingCharges(data)}
        initialChargeId={chargeId}
        onCancel={() => goBack(parent)}
        onSaved={async () => {
          await reload();
          goBack(parent, { notice: "Pago registrado; saldo y estados actualizados.", force: true });
        }}
      />
    </FormScreen>
  );
}

export function OrderFormPage({ data, reload }: { data: Bootstrap; reload: () => Promise<void> }) {
  const parent = paths.pagos("pedidos");
  return (
    <FormScreen>
      <OrderForm
        data={data}
        onCancel={() => goBack(parent)}
        onSaved={async () => {
          await reload();
          goBack(parent, { notice: "Pedido registrado con sus cobros.", force: true });
        }}
      />
    </FormScreen>
  );
}
