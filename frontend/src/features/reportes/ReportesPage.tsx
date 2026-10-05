import type { Bootstrap } from "../../shared/api/contracts";
import { money, paidFor } from "../../shared/lib/format";
import { PageHeader } from "../../shared/ui/PageHeader";
export function ReportesPage({ data }: { data: Bootstrap }) {
  const valid = data.payments.filter((p) => p.valid);
  return (
    <>
      <PageHeader
        title="Reportes"
        help="Resume únicamente movimientos válidos y datos actuales de la escuela."
      />
      <div className="grid cols-3">
        <article className="card metric">
          <span className="metric-label">Ingresos vigentes</span>
          <strong className="metric-value">{money(valid.reduce((s, p) => s + p.amount, 0))}</strong>
        </article>
        <article className="card metric">
          <span className="metric-label">Saldo total</span>
          <strong className="metric-value">
            {money(data.charges.reduce((s, c) => s + c.total - paidFor(c.id, data.payments), 0))}
          </strong>
        </article>
        <article className="card metric">
          <span className="metric-label">Alumnos activos</span>
          <strong className="metric-value">
            {data.students.filter((s) => s.status === "Activo").length}
          </strong>
        </article>
      </div>
    </>
  );
}
