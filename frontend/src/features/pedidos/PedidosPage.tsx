import type { Bootstrap } from "../../shared/api/contracts";
import { goBack } from "../../shared/lib/navigation";
import { paths } from "../../shared/lib/paths";
import { FormScreen } from "../../shared/ui/FormScreen";
import { Link } from "../../shared/ui/Link";
import { PageHeader } from "../../shared/ui/PageHeader";
import { OrderForm } from "./components/OrderForm";
import { OrdersTable } from "./components/OrdersTable";

export function PedidosPage({ data, reload }: { data: Bootstrap; reload: () => Promise<void> }) {
  return (
    <>
      <PageHeader help="Lo que se ha pedido a cada alumno. Registrar un pedido registra su pago completo, y se entrega todo junto con el botón Entregar. El dinero queda en Pagos." />
      <OrdersTable
        data={data}
        reload={reload}
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
