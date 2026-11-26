import type { Bootstrap, Charge } from "../../../shared/api/contracts";
import { date } from "../../../shared/lib/format";
import { DataTable, type Column } from "../../../shared/ui/DataTable";
import { FilterSelect } from "../../../shared/ui/FilterSelect";
import { Link } from "../../../shared/ui/Link";
import { ListTools } from "../../../shared/ui/ListTools";
import { Money } from "../../../shared/ui/Money";
import { Status } from "../../../shared/ui/Status";
import { chargePresentation } from "../model/pagos.model";

/** Qué cobros se muestran en Mensualidades: por defecto los que todavía no se pagan. */
export type ChargeShow = "unpaid" | "paid" | "all";

export type ChargeFilters = {
  query: string;
  show: ChargeShow;
};

/**
 * Cobros de un tipo. Las mensualidades llevan estado (Pagado / No pagado) y botón de pago; los pedidos y
 * los exámenes se cobran al registrarse, así que solo se listan, sin estado ni botón.
 */
export function ChargesOverview({
  data,
  paymentLink,
  filters,
  onFilters,
  category,
}: {
  data: Bootstrap;
  paymentLink: (charge: Charge) => string;
  filters: ChargeFilters;
  onFilters: (next: ChargeFilters) => void;
  /** Tipo de cobro de la pestaña: Mensualidades, Pedidos o Exámenes. */
  category: string;
}) {
  const { query, show } = filters;
  const monthly = category === "Mensualidades";
  const text = query.trim().toLocaleLowerCase("es");
  const rows = data.charges.filter((charge) => {
    const paid = chargePresentation(charge, data).balance <= 0;
    return (
      charge.category === category &&
      (!monthly || show === "all" || (show === "paid" ? paid : !paid)) &&
      (!text ||
        studentName(data, charge.studentId).toLocaleLowerCase("es").includes(text) ||
        charge.concept.toLocaleLowerCase("es").includes(text))
    );
  });

  const columns: Column<Charge>[] = [
    {
      header: "Alumno",
      primary: true,
      cell: (charge) => <strong>{studentName(data, charge.studentId)}</strong>,
    },
    { header: "Concepto", cell: (charge) => charge.concept },
    { header: monthly ? "Fecha límite" : "Fecha", cell: (charge) => date(charge.due) },
    { header: "Total", cell: (charge) => <Money value={charge.total} /> },
  ];
  if (monthly)
    columns.push(
      {
        header: "Estado",
        cell: (charge) => {
          const paid = chargePresentation(charge, data).balance <= 0;
          return (
            <Status tone={paid ? "success" : "danger"}>{paid ? "Pagado" : "No pagado"}</Status>
          );
        },
      },
      {
        header: "Acciones",
        actions: true,
        cell: (charge) =>
          chargePresentation(charge, data).balance > 0 && (
            <Link className="button secondary small" to={paymentLink(charge)}>
              Registrar pago
            </Link>
          ),
      },
    );

  return (
    <>
      <ListTools
        searchId="charge-search"
        searchLabel="Buscar alumno o concepto"
        query={query}
        onQuery={(event) => onFilters({ ...filters, query: event.target.value })}
        filters={
          monthly && (
            <FilterSelect
              id="scope-filter"
              label="Mostrar"
              value={show}
              onChange={(event) =>
                onFilters({ ...filters, show: event.target.value as ChargeShow })
              }
            >
              <option value="unpaid">No pagados</option>
              <option value="paid">Pagados</option>
              <option value="all">Todos</option>
            </FilterSelect>
          )
        }
      />
      <DataTable
        rows={rows}
        rowKey={(charge) => charge.id}
        columns={columns}
        empty={{
          title: monthly && show === "unpaid" ? "Todo está pagado" : "Sin cobros",
          text: query
            ? "Cambia la búsqueda."
            : monthly && show === "unpaid"
              ? "No hay mensualidades pendientes."
              : "No hay cobros para mostrar.",
        }}
      />
    </>
  );
}

function studentName(data: Bootstrap, studentId: string) {
  return data.students.find((student) => student.id === studentId)?.name ?? "Alumno no disponible";
}
