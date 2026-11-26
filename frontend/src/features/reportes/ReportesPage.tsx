import { useMemo, useState } from "react";
import type { Bootstrap } from "../../shared/api/contracts";
import { DataTable } from "../../shared/ui/DataTable";
import { PageHeader } from "../../shared/ui/PageHeader";
import {
  formatMetric,
  mean,
  monthOf,
  monthsEnding,
  reportCsv,
  summaryMetrics,
  type Metric,
} from "./model/reportes.model";

const ranges = [1, 3, 6, 12] as const;
const shortMonth = (month: string) =>
  new Intl.DateTimeFormat("es-MX", { month: "short" })
    .format(new Date(`${month}-01T12:00:00`))
    .replace(".", "");

/** Verde si el mes queda por encima del promedio de su fila y rojo si por debajo (al revés en bajas). */
function tone(item: Metric, value: number | null) {
  const average = mean(item.values);
  if (value === null || average === null || Math.abs(value - average) < 0.005) return undefined;
  const above = value > average;
  const good = item.label === "Alumnos que se dieron de baja" ? !above : above;
  return good ? "trend-up" : "trend-down";
}

/** Descarga un archivo de texto sin pasar por el servidor. */
function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function ReportesPage({ data }: { data: Bootstrap }) {
  const current = monthOf(data.demoDate);
  const thisYear = Number(current.slice(0, 4));
  const firstYear = useMemo(() => {
    const years = [
      ...data.students.map((student) => student.enrollmentDate),
      ...data.payments.map((payment) => payment.date),
      ...data.sessions.map((session) => session.date),
    ].map((day) => Number(day.slice(0, 4)));
    return Math.min(thisYear, ...years.filter(Boolean));
  }, [data, thisYear]);
  const years = Array.from({ length: thisYear - firstYear + 1 }, (_, i) => thisYear - i);
  const [year, setYear] = useState(thisYear);
  const [range, setRange] = useState<(typeof ranges)[number]>(3);

  const months = useMemo(() => monthsEnding(`${year}-12`, 12), [year]);
  const metrics = useMemo(() => summaryMetrics(data, months, data.demoDate), [data, months]);
  const lastShown = year === thisYear ? current : `${year}-12`;

  function exportRange() {
    const exportMonths = monthsEnding(lastShown, range);
    const text = reportCsv(summaryMetrics(data, exportMonths, data.demoDate), exportMonths);
    download(`reporte-${exportMonths[0]}_a_${exportMonths[exportMonths.length - 1]}.csv`, text);
  }

  return (
    <>
      <PageHeader help="Cómo va la escuela en el año elegido, mes por mes; la tabla se va llenando conforme pasan los meses. El ingreso cuenta solo las mensualidades; lo cobrado por exámenes y pedidos se entrega a la institución o al proveedor, así que no cuenta como ingreso de la escuela. Descargar Excel baja el último mes, 3, 6 o 12 meses. El detalle de cada pago está en Pagos." />
      <div className="toolbar no-print">
        <div className="field">
          <label htmlFor="report-year">Año</label>
          <select
            id="report-year"
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
          >
            {years.map((choice) => (
              <option key={choice} value={choice}>
                {choice}
              </option>
            ))}
          </select>
        </div>
        <div className="toolbar-action">
          <div className="field">
            <label htmlFor="report-range">Descargar</label>
            <select
              id="report-range"
              value={range}
              onChange={(event) => setRange(Number(event.target.value) as (typeof ranges)[number])}
            >
              {ranges.map((choice) => (
                <option key={choice} value={choice}>
                  {choice === 1 ? "Último mes" : `Últimos ${choice} meses`}
                </option>
              ))}
            </select>
          </div>
          <button className="button export" onClick={exportRange}>
            Descargar Excel
          </button>
          <button className="button export" onClick={() => window.print()}>
            Guardar PDF
          </button>
        </div>
      </div>
      <p className="print-only report-title">
        {data.school.name} · Reporte {year}
      </p>

      <section className="section-gap">
        <h2 className="no-print">Resumen {year}</h2>
        <DataTable
          rows={metrics}
          rowKey={(item) => item.label}
          empty={{ title: "Sin datos", text: "Todavía no hay movimientos en este año." }}
          columns={[
            { header: "Concepto", primary: true, cell: (item) => <strong>{item.label}</strong> },
            ...months.map((month) => ({
              header: shortMonth(month),
              cell: (item: Metric) => {
                const value = item.values[months.indexOf(month)];
                return <span className={tone(item, value)}>{formatMetric(item.kind, value)}</span>;
              },
            })),
            {
              header: "Promedio",
              cell: (item: Metric) => formatMetric(item.kind, mean(item.values)),
            },
          ]}
        />
      </section>
    </>
  );
}
