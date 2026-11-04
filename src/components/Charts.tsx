/* Dependency-free chart primitives: CSS bars, SVG area line and gauge. */

export interface Bar {
  key: string;
  label: string;
  value: number;
  title?: string;
  highlight?: boolean;
}

export function BarChart({
  bars,
  color = "var(--blue)",
  height = 140,
  emptyText = "No data",
}: {
  bars: Bar[];
  color?: string;
  height?: number;
  emptyText?: string;
}) {
  const max = bars.reduce((m, b) => Math.max(m, b.value), 0);
  if (bars.length === 0) return <p className="chart-empty">{emptyText}</p>;
  return (
    <div className="barchart" style={{ height }}>
      {bars.map((bar) => {
        const pct = max > 0 ? Math.max(bar.value > 0 ? 3 : 0, (bar.value / max) * 100) : 0;
        return (
          <div key={bar.key} className="barchart-col" title={bar.title ?? `${bar.label}: ${bar.value.toLocaleString()}`}>
            <div className="barchart-track">
              <div
                className={`barchart-bar ${bar.highlight ? "barchart-bar-highlight" : ""}`}
                style={{ height: `${pct}%`, background: bar.highlight ? "var(--gold)" : color }}
              />
            </div>
            <span className="barchart-label">{bar.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function AreaChart({
  points,
  height = 120,
  color = "var(--gold)",
  labelFor,
}: {
  points: number[];
  height?: number;
  color?: string;
  labelFor?: (index: number) => string;
}) {
  if (points.length === 0) return <p className="chart-empty">No data</p>;
  const width = 600;
  const max = points.reduce((m, v) => Math.max(m, v), 0);
  const stepX = points.length > 1 ? width / (points.length - 1) : width;
  const y = (v: number) => (max > 0 ? height - (v / max) * (height - 8) - 2 : height - 2);
  const line = points.map((v, i) => `${i === 0 ? "M" : "L"} ${(i * stepX).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg
      className="areachart"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="activity curve"
    >
      <path d={area} fill={color} opacity={0.16} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
      {labelFor ? (
        <title>{points.map((v, i) => `${labelFor(i)}: ${v}`).join("\n")}</title>
      ) : null}
    </svg>
  );
}

export function Gauge({
  value,
  max,
  label,
  unit,
  size = 168,
}: {
  value: number;
  max: number;
  label: string;
  unit: string;
  size?: number;
}) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const arcLength = Math.PI * r; // half circle
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <div className="gauge" style={{ width: size }}>
      <svg width={size} height={size / 2 + stroke} viewBox={`0 0 ${size} ${size / 2 + stroke}`}>
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="var(--line)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="var(--gold)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(arcLength * pct).toFixed(1)} ${arcLength.toFixed(1)}`}
        />
      </svg>
      <div className="gauge-readout">
        <span className="gauge-value">{value.toFixed(1)}</span>
        <span className="gauge-unit">{unit}</span>
      </div>
      <span className="gauge-label">{label}</span>
    </div>
  );
}

export function ProgressBar({
  value,
  tone = "blue",
  height = 10,
}: {
  value: number; // 0..1
  tone?: "blue" | "gold" | "green" | "purple";
  height?: number;
}) {
  const pct = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  return (
    <div className="progress" style={{ height }}>
      <div className={`progress-fill progress-${tone}`} style={{ width: `${(pct * 100).toFixed(2)}%` }} />
    </div>
  );
}
