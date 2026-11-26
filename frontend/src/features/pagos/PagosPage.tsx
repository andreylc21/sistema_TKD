import { useState } from "react";
import type { Bootstrap } from "../../shared/api/contracts";
import { goBack, navigate } from "../../shared/lib/navigation";
import { paths } from "../../shared/lib/paths";
import { FormScreen } from "../../shared/ui/FormScreen";
import { Link } from "../../shared/ui/Link";
import { Money } from "../../shared/ui/Money";
import { PageHeader } from "../../shared/ui/PageHeader";
import { SummaryItem, SummaryStrip } from "../../shared/ui/SummaryStrip";
import { Tabs } from "../../shared/ui/Tabs";
import { monthLabel } from "../reportes/model/reportes.model";
import { ChargesOverview, type ChargeFilters, type ChargeShow } from "./components/ChargesView";
import { PaymentForm } from "./components/PaymentForm";
import { PaymentHistory } from "./PaymentHistory";
import { getPendingCharges, paymentsSummary } from "./model/pagos.model";

const tabs = ["Mensualidades", "Pedidos", "Exámenes", "Historial"] as const;
type Tab = (typeof tabs)[number];

export function PagosPage({
  data,
  reload,
  q,
  progress,
  all,
}: {
  data: Bootstrap;
  reload: () => Promise<void>;
  q?: string;
  progress?: string;
  all?: boolean;
}) {
  const [tab, setTab] = useState<Tab>("Mensualidades");
  const summary = paymentsSummary(data);
  // Por compatibilidad con enlaces anteriores: `avance=Pagado` abre los pagados y `todos=1` todos.
  const show: ChargeShow = all ? "all" : progress === "Pagado" ? "paid" : "unpaid";
  const filters: ChargeFilters = { query: q ?? "", show };
  // Los filtros viven en la URL: se conservan al recargar, volver atrás o compartir el enlace.
  const changeFilters = (next: ChargeFilters) =>
    navigate(
      paths.pagos(undefined, {
        q: next.query || undefined,
        progress: next.show === "paid" ? "Pagado" : undefined,
        all: next.show === "all",
      }),
      { replace: true },
    );

  return (
    <>
      <PageHeader help="Aquí se registran los pagos. Las mensualidades se cobran aquí: cada una está Pagada o No pagada. Los pedidos y los exámenes se pagan completos al registrarse en sus pantallas, por eso aquí solo se listan. Las cifras de arriba son del mes de la fecha de hoy." />
      <p className="report-heading period-label">{monthLabel(summary.month)}</p>
      <SummaryStrip compact className="spacer-bottom">
        <SummaryItem label="Mensualidades cobradas">
          <Money value={summary.monthly} />
        </SummaryItem>
        <SummaryItem label="Mensualidades por cobrar">
          <Money value={summary.toCollect} />
        </SummaryItem>
        <SummaryItem label="Pedidos cobrados">
          <Money value={summary.orders} />
        </SummaryItem>
        <SummaryItem label="Exámenes cobrados">
          <Money value={summary.exams} />
        </SummaryItem>
      </SummaryStrip>
      <Tabs
        label="Pagos"
        items={tabs.map((name) => ({ id: name, label: name }))}
        value={tab}
        onChange={setTab}
        action={
          <Link className="button" to={paths.pagoNuevo()}>
            Registrar pago
          </Link>
        }
      />
      {tab === "Historial" ? (
        <PaymentHistory data={data} reload={reload} />
      ) : (
        <ChargesOverview
          data={data}
          category={tab}
          filters={filters}
          onFilters={changeFilters}
          paymentLink={(charge) => paths.pagoNuevo(charge.id)}
        />
      )}
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
