import { useState } from "react";
import type { Bootstrap, Charge } from "../../../shared/api/contracts";
import type { DueStatus, PaymentProgress } from "../../../shared/lib/format";
import { date, paidFor } from "../../../shared/lib/format";
import { Link } from "../../../shared/ui/Link";
import { Metric, Money } from "../../../shared/ui/Money";
import { Empty } from "../../../shared/ui/PageHeader";
import { chargePresentation, dueTone, getPendingCharges, progressTone } from "../model/pagos.model";

export function ChargesOverview({
  data,
  paymentLink,
  initialDue = "",
}: {
  data: Bootstrap;
  paymentLink?: (charge: Charge) => string;
  initialDue?: DueStatus | "Por vencer" | "";
}) {
  const [query, setQuery] = useState("");
  const [progress, setProgress] = useState<PaymentProgress | "">("");
  const [due, setDue] = useState<DueStatus | "Por vencer" | "">(initialDue);
  const pending = getPendingCharges(data);
  // Recibido y total se calculan sobre los mismos cargos mostrados, para que sean comparables.
  const received = data.charges.reduce((sum, charge) => sum + paidFor(charge.id, data.payments), 0);
  const rows = data.charges.filter((charge) => {
    const student = studentName(data, charge.studentId).toLocaleLowerCase("es");
    const state = chargePresentation(charge, data);
    return (
      (!query ||
        student.includes(query.toLocaleLowerCase("es")) ||
        charge.concept.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es"))) &&
      (!progress || state.progress === progress) &&
      (!due ||
        (due === "Por vencer"
          ? state.due === "Próximo a pagar" || state.due === "Vence hoy"
          : state.due === due))
    );
  });

  return (
    <>
      <div className="summary-strip">
        <Metric label="Dinero recibido">
          <Money value={received} />
        </Metric>
        <Metric label="Total de cargos">
          <Money value={data.charges.reduce((sum, charge) => sum + charge.total, 0)} />
        </Metric>
        <Metric label="Saldo pendiente">
          <Money
            value={pending.reduce(
              (sum, charge) => sum + chargePresentation(charge, data).balance,
              0,
            )}
          />
        </Metric>
      </div>
      <div className="toolbar spacer-top">
        <div className="field grow">
          <label htmlFor="charge-search">Buscar alumno o concepto</label>
          <input
            id="charge-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="progress-filter">Avance de pago</label>
          <select
            id="progress-filter"
            value={progress}
            onChange={(event) => setProgress(event.target.value as PaymentProgress | "")}
          >
            <option value="">Todos</option>
            <option>Sin pagos</option>
            <option>Pago parcial</option>
            <option>Pagado</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="due-filter">Vencimiento con saldo</label>
          <select
            id="due-filter"
            value={due}
            onChange={(event) => setDue(event.target.value as DueStatus | "Por vencer" | "")}
          >
            <option value="">Todos</option>
            <option value="Por vencer">Vence hoy y próximos</option>
            <option>Pendiente</option>
            <option>Próximo a pagar</option>
            <option>Vence hoy</option>
            <option>Vencido</option>
          </select>
        </div>
      </div>
      <p className="results-meta">
        <strong>{rows.length}</strong> {rows.length === 1 ? "cargo" : "cargos"}
      </p>
      <section className="table-surface table-wrap spacer-top">
        {rows.length ? (
          <table className="financial-table">
            <thead>
              <tr>
                <th>Alumno / concepto</th>
                <th>Fecha límite</th>
                <th className="num">Total</th>
                <th className="num">Recibido</th>
                <th className="num">Saldo</th>
                <th>Avance</th>
                <th>Vencimiento</th>
                {paymentLink && (
                  <th>
                    <span className="sr-only">Acción</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((charge) => {
                const state = chargePresentation(charge, data);
                return (
                  <tr key={charge.id}>
                    <td className="primary-cell">
                      <strong>{studentName(data, charge.studentId)}</strong>
                      <span>{charge.concept}</span>
                    </td>
                    <td className="nowrap">{date(charge.due)}</td>
                    <td className="num">
                      <Money value={charge.total} />
                    </td>
                    <td className="num">
                      <Money value={state.received} />
                    </td>
                    <td className="num">
                      <strong>
                        <Money value={state.balance} />
                      </strong>
                    </td>
                    <td>
                      <span className={`badge ${progressTone(state.progress)}`}>
                        {state.progress}
                      </span>
                    </td>
                    <td>
                      {state.due ? (
                        <span className={`badge ${dueTone(state.due)}`}>{state.due}</span>
                      ) : (
                        <span className="muted">Sin alerta</span>
                      )}
                    </td>
                    {paymentLink && (
                      <td>
                        {state.balance > 0 && (
                          <Link className="button secondary small" to={paymentLink(charge)}>
                            Registrar pago
                          </Link>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <Empty
            title="Sin cargos para estos filtros"
            text="Ajusta la búsqueda o los estados seleccionados."
          />
        )}
      </section>
    </>
  );
}

function studentName(data: Bootstrap, studentId: string) {
  return data.students.find((student) => student.id === studentId)?.name ?? "Alumno no disponible";
}
