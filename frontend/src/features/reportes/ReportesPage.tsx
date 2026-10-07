import type { Bootstrap } from "../../shared/api/contracts";
import { paidFor } from "../../shared/lib/format";
import { Money } from "../../shared/ui/Money";
import { PageHeader } from "../../shared/ui/PageHeader";
export function ReportesPage({ data }: { data: Bootstrap }) {
  const valid = data.payments.filter((p) => p.valid);
  return (
    <>
      <PageHeader help="Resume únicamente movimientos válidos y datos actuales de la escuela." />
      <div className="grid cols-3">
        <article className="card metric">
          <span className="metric-label">Ingresos vigentes</span>
          <strong className="metric-value">
            <Money value={valid.reduce((s, p) => s + p.amount, 0)} />
          </strong>
        </article>
        <article className="card metric">
          <span className="metric-label">Saldo total</span>
          <strong className="metric-value">
            <Money
              value={data.charges.reduce((s, c) => s + c.total - paidFor(c.id, data.payments), 0)}
            />
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
