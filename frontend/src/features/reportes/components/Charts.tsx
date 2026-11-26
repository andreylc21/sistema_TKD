import { money } from "../../../shared/lib/format";

const shortMonth = (month: string) =>
  new Intl.DateTimeFormat("es-MX", { month: "short" })
    .format(new Date(`${month}-01T12:00:00`))
    .replace(".", "");

/** Barras verticales, una por mes; la del mes elegido va resaltada. */
export function BarChart({
  title,
  items,
  current,
  wide = false,
}: {
  title: string;
  items: { month: string; value: number }[];
  current: string;
  wide?: boolean;
}) {
  const peak = Math.max(1, ...items.map((item) => item.value));
  const summary = items.map((item) => `${shortMonth(item.month)} ${money(item.value)}`).join(", ");
  return (
    <figure
      className={`chart${wide ? " wide" : ""}`}
      role="img"
      aria-label={`${title}: ${summary}`}
    >
      <figcaption>{title}</figcaption>
      <div className="chart-bars" aria-hidden="true">
        {items.map((item) => (
          <div className={`chart-bar${item.month === current ? " current" : ""}`} key={item.month}>
            <span className="chart-bar-value">{money(item.value).replace(/\.00$/, "")}</span>
            <span className="chart-bar-fill" style={{ height: `${(item.value / peak) * 100}%` }} />
            <span className="chart-bar-label">{shortMonth(item.month)}</span>
          </div>
        ))}
      </div>
    </figure>
  );
}

/** Línea simple de los últimos meses; los meses sin dato se omiten. */
export function LineChart({
  title,
  items,
  current,
  suffix = "",
  wide = false,
}: {
  title: string;
  items: { month: string; value: number | null }[];
  current: string;
  suffix?: string;
  wide?: boolean;
}) {
  const width = wide ? 720 : 300;
  const height = wide ? 240 : 140;
  const side = 20;
  const top = 26;
  const bottom = 26;
  const known = items.flatMap((item) => (item.value === null ? [] : [item.value]));
  const low = Math.min(...known, 0);
  const high = Math.max(...known, 1);
  const span = Math.max(1, high - low);
  const x = (index: number) => side + (index * (width - side * 2)) / Math.max(1, items.length - 1);
  const y = (value: number) => top + ((high - value) / span) * (height - top - bottom);
  const points = items.flatMap((item, index) =>
    item.value === null
      ? []
      : [{ month: item.month, value: item.value, x: x(index), y: y(item.value) }],
  );
  const summary = items
    .map(
      (item) =>
        `${shortMonth(item.month)} ${item.value === null ? "sin datos" : `${item.value}${suffix}`}`,
    )
    .join(", ");
  return (
    <figure
      className={`chart${wide ? " wide" : ""}`}
      role="img"
      aria-label={`${title}: ${summary}`}
    >
      <figcaption>{title}</figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <polyline
          className="line"
          fill="none"
          points={points.map((point) => `${point.x},${point.y}`).join(" ")}
        />
        {points.map((point) => (
          <g key={point.month}>
            <circle
              className={`dot${point.month === current ? " current" : ""}`}
              cx={point.x}
              cy={point.y}
              r={point.month === current ? 4.5 : 3}
            />
            <text className="dot-value" x={point.x} y={point.y - 9} textAnchor="middle">
              {point.value}
              {suffix}
            </text>
          </g>
        ))}
        {items.map((item, index) => (
          <text className="axis" key={item.month} x={x(index)} y={height - 8} textAnchor="middle">
            {shortMonth(item.month)}
          </text>
        ))}
      </svg>
    </figure>
  );
}
