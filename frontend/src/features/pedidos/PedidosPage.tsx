import type { Bootstrap } from "../../shared/api/contracts";
import { goBack } from "../../shared/lib/navigation";
import { paths } from "../../shared/lib/paths";
import { FormScreen } from "../../shared/ui/FormScreen";
import { Link } from "../../shared/ui/Link";
import { PageHeader } from "../../shared/ui/PageHeader";
import { OrderForm } from "./components/OrderForm";
import { OrdersTable } from "./components/OrdersTable";

export function PedidosPage({ data }: { data: Bootstrap }) {
  return (
    <>
      <PageHeader help="Historial de lo que se ha pedido a cada alumno, si ya pagó y si ya se le entregó. El dinero se registra en Pagos." />
      <OrdersTable
        data={data}
        action={
          <Link className="button" to={paths.pedidoNuevo}>
            Registrar pedido
          </Link>
        }
      />
    </>
  );
}

export function OrderFormPage({ data, reload }: { data: Bootstrap; reload: () => Promise<void> }) {
  const parent = paths.pedidos;
  return (
    <FormScreen title="Datos del pedido">
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
