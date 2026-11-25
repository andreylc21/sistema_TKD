import type { Bootstrap } from "../../shared/api/contracts";
import type { DueStatus, PaymentProgress } from "../../shared/lib/format";
import { goBack, navigate } from "../../shared/lib/navigation";
import { paths } from "../../shared/lib/paths";
import { FormScreen } from "../../shared/ui/FormScreen";
import { Link } from "../../shared/ui/Link";
import { PageHeader } from "../../shared/ui/PageHeader";
import { ChargesOverview, type ChargeFilters } from "./components/ChargesView";
import { PaymentForm } from "./components/PaymentForm";
import { PaymentHistory } from "./PaymentHistory";
import { getPendingCharges } from "./model/pagos.model";

type DueFilter = DueStatus | "Por vencer" | "";

const progressFilters: PaymentProgress[] = ["Sin pagos", "Pago parcial", "Pagado"];

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
  due,
  q,
  progress,
  all,
}: {
  data: Bootstrap;
  reload: () => Promise<void>;
  due?: string;
  q?: string;
  progress?: string;
  all?: boolean;
}) {
  const filters: ChargeFilters = {
    query: q ?? "",
    progress: progressFilters.find((item) => item === progress) ?? "",
    due: dueFilters.find((item) => item === due) ?? "",
    all: Boolean(all),
  };
  // Los filtros viven en la URL: se conservan al recargar, volver atrás o compartir el enlace.
  const changeFilters = (next: ChargeFilters) =>
    navigate(
      paths.pagos(next.due || undefined, {
        q: next.query || undefined,
        progress: next.progress || undefined,
        all: next.all,
      }),
      { replace: true },
    );

  return (
    <>
      <PageHeader help="Registra un pago desde el botón de arriba a la derecha: eliges al alumno y ves todo lo que debe. Los pedidos y exámenes generan sus cobros aquí." />
      <ChargesOverview
        data={data}
        filters={filters}
        onFilters={changeFilters}
        paymentLink={(charge) => paths.pagoNuevo(charge.id)}
        action={
          <Link className="button" to={paths.pagoNuevo()}>
            Registrar pago
          </Link>
        }
      />
      <PaymentHistory data={data} reload={reload} />
    </>
  );
}

export function PaymentPage({
  data,
  chargeId,
  studentId,
  reload,
}: {
  data: Bootstrap;
  chargeId?: string;
  studentId?: string;
  reload: () => Promise<void>;
}) {
  const parent = paths.pagos();
  return (
    <FormScreen title="Datos del pago">
      <PaymentForm
        data={data}
        charges={getPendingCharges(data)}
        initialChargeId={chargeId}
        initialStudentId={studentId}
        onCancel={() => goBack(parent)}
        onSaved={async () => {
          await reload();
          goBack(parent, { notice: "Pago registrado; saldo y estados actualizados.", force: true });
        }}
      />
    </FormScreen>
  );
}
