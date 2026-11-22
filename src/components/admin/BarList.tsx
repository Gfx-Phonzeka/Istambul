// Single-series horizontal bars: one hue (primary), value in text ink, hover shows the exact figure.
export function BarList({ rows, unit, empty }: { rows: { label: string; n: number; extra?: string }[]; unit?: string; empty: string }) {
  if (!rows.length) return <p className="muted small" style={{ margin: 0 }}>{empty}</p>;
  const max = Math.max(...rows.map((r) => r.n), 1);
  return (
    <ul className="barlist">
      {rows.map((r) => (
        <li key={r.label} title={`${r.label}: ${r.n}${unit ? " " + unit : ""}${r.extra ? " · " + r.extra : ""}`}>
          <div className="barlist-label"><span>{r.label || "—"}</span><strong>{r.n}</strong></div>
          <div className="barlist-track"><span style={{ width: `${(r.n / max) * 100}%` }} /></div>
          {r.extra && <div className="muted" style={{ fontSize: "var(--text-xs)" }}>{r.extra}</div>}
        </li>
      ))}
    </ul>
  );
}

export function ColumnChart({ rows, label }: { rows: { day: string; n: number }[]; label: (day: string) => string }) {
  const max = Math.max(...rows.map((r) => r.n), 1);
  return (
    <div className="columns" role="img" aria-label="Sign-ins per day">
      <div className="columns-plot">
        {[25, 50, 75].map((y) => <span key={y} className="columns-gridline" style={{ bottom: `${y}%` }} aria-hidden="true" />)}
        {rows.map((r) => (
          <div key={r.day} className="columns-col" title={`${label(r.day)}: ${r.n}`}>
            <span style={{ height: `${(r.n / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="columns-axis muted">
        <span>{rows[0] ? label(rows[0].day) : ""}</span><span>max {max}</span><span>{rows.length ? label(rows[rows.length - 1].day) : ""}</span>
      </div>
    </div>
  );
}
