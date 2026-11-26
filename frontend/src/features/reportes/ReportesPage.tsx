import { useMemo, useState } from "react";
import type { Bootstrap } from "../../shared/api/contracts";
import { Money } from "../../shared/ui/Money";
import { PageHeader } from "../../shared/ui/PageHeader";
import { StatCard } from "../../shared/ui/StatCard";
import { Tabs } from "../../shared/ui/Tabs";
import { BarChart, LineChart } from "./components/Charts";
import {
  attendanceByMonth,
  examResults,
  incomeByMonth,
  monthLabel,
  monthOf,
  monthsEnding,
  movements,
} from "./model/reportes.model";

const trailing = 6;
const views = [
  { id: "ingresos", label: "Ingresos" },
  { id: "alumnos", label: "Alumnos" },
  { id: "asistencia", label: "Asistencia" },
] as const;
type View = (typeof views)[number]["id"];

/** "▲ $500.00 que el mes anterior" / "▼ …" / "Igual que el mes anterior", con su tendencia. */
function change(now: number, before: number | undefined, render: (value: number) => string) {
  if (before === undefined) return { text: undefined, trend: undefined } as const;
  const diff = now - before;
  if (Math.abs(diff) < 0.005)
    return { text: "Igual que el mes anterior", trend: undefined } as const;
  return {
    text: `${diff > 0 ? "▲" : "▼"} ${render(Math.abs(diff))} que el mes anterior`,
    trend: diff > 0 ? "up" : "down",
  } as const;
}

export function ReportesPage({ data }: { data: Bootstrap }) {
  const current = monthOf(data.demoDate);
  const choices = useMemo(() => monthsEnding(current, 12).reverse(), [current]);
  const [month, setMonth] = useState(current);
  const [view, setView] = useState<View>("ingresos");
  const months = useMemo(() => monthsEnding(month, trailing), [month]);
  const income = useMemo(() => incomeByMonth(data, months), [data, months]);
  const flow = useMemo(() => movements(data.students, months), [data.students, months]);
  const attendance = useMemo(() => attendanceByMonth(data, months), [data, months]);
  const exams = useMemo(() => examResults(data, month), [data, month]);

  const last = months.length - 1;
  const now = { income: income[last], flow: flow[last], attendance: attendance[last] };
  const before = {
    income: income[last - 1],
    flow: flow[last - 1],
    attendance: attendance[last - 1],
  };
  const money = (value: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);
  const incomeChange = change(now.income.total, before.income?.total, money);
  const peopleChange = change(now.flow.active, before.flow?.active, String);
  const attendanceChange =
    now.attendance.percent !== null && before.attendance?.percent != null
      ? change(now.attendance.percent, before.attendance.percent, (value) => `${value} pts`)
      : { text: undefined, trend: undefined };
  const net = now.flow.joined - now.flow.left;

  return (
    <>
      <PageHeader help="Cómo va la escuela en el mes elegido, comparado con el anterior. El ingreso cuenta solo las mensualidades; lo cobrado por exámenes y pedidos se entrega a la institución o al proveedor, así que no cuenta como ingreso de la escuela. El detalle de cada pago está en Pagos." />
      <div className="toolbar no-print">
        <div className="field">
          <label htmlFor="report-month">Periodo</label>
          <select
            id="report-month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          >
            {choices.map((choice) => (
              <option key={choice} value={choice}>
                {monthLabel(choice)}
              </option>
            ))}
          </select>
        </div>
        <div className="toolbar-action">
          <button className="button export" onClick={() => window.print()}>
            Guardar PDF
          </button>
        </div>
      </div>
      <p className="print-only report-title">Reporte · {monthLabel(month)}</p>

      <div className="stat-grid">
        <StatCard
          label="Cobrado en mensualidades"
          value={<Money value={now.income.total} />}
          note={incomeChange.text}
          trend={incomeChange.trend}
        />
        <StatCard
          label="Alumnos activos"
          value={now.flow.active}
          note={
            now.flow.joined || now.flow.left
              ? `${net >= 0 ? "+" : "−"}${Math.abs(net)} este mes · ${now.flow.joined} altas, ${now.flow.left} bajas`
              : peopleChange.text
          }
          trend={
            now.flow.joined || now.flow.left
              ? net > 0
                ? "up"
                : net < 0
                  ? "down"
                  : undefined
              : peopleChange.trend
          }
        />
        <StatCard
          label="Asistencia"
          value={now.attendance.percent === null ? "—" : `${now.attendance.percent}%`}
          note={
            attendanceChange.text ??
            (now.attendance.recorded
              ? `${now.attendance.present} de ${now.attendance.recorded} asistencias`
              : undefined)
          }
          trend={attendanceChange.trend}
        />
        <StatCard
          label="Aprobaron examen"
          value={exams.presented ? `${exams.passed} de ${exams.presented}` : "—"}
          note="Cada aprobado sube una cinta"
        />
      </div>

      <Tabs label="Gráfica" items={views} value={view} onChange={setView} />
      <div className="spacer-top">
        {view === "ingresos" && (
          <BarChart
            wide
            title="Ingreso por mensualidades · últimos 6 meses"
            current={month}
            items={income.map((row) => ({ month: row.month, value: row.total }))}
          />
        )}
        {view === "alumnos" && (
          <LineChart
            wide
            title="Alumnos activos · últimos 6 meses"
            current={month}
            items={flow.map((row) => ({ month: row.month, value: row.active }))}
          />
        )}
        {view === "asistencia" && (
          <LineChart
            wide
            title="Asistencia · últimos 6 meses"
            suffix="%"
            current={month}
            items={attendance.map((row) => ({ month: row.month, value: row.percent }))}
          />
        )}
      </div>
    </>
  );
}
