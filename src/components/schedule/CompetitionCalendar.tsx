import Link from "next/link";

// Competition calendar by day, without session times: disciplines × days, one coloured cell per competition day.
export type DayCode = "X" | "F" | "M" | "P" | "T" | "C";
export interface CalendarRow { id: string; label: string; venue: string; venueSlug: string | null; days: Record<string, DayCode> }
export interface CalendarGroup { key: string; title: string; days: string[]; rows: CalendarRow[] }

export function CompetitionCalendar({ groups, today, intl, labels }: {
  groups: CalendarGroup[];
  today: string;
  intl: string;
  labels: { discipline: string; legend: Record<DayCode, string>; note: string };
}) {
  const wd = new Intl.DateTimeFormat(intl, { weekday: "narrow", timeZone: "UTC" });
  const mon = new Intl.DateTimeFormat(intl, { month: "short", timeZone: "UTC" });
  const used = new Set(groups.flatMap((g) => g.rows.flatMap((r) => Object.values(r.days))));
  return (
    <div className="stack">
      {groups.map((g) => (
        <section key={g.key} className="card stack-sm" aria-labelledby={`cal-${g.key}`}>
          <h2 id={`cal-${g.key}`} style={{ margin: 0 }}>{g.title}</h2>
          <div className="cal-scroll" tabIndex={0} role="region" aria-label={g.title}>
            <table className="cal-grid">
              <thead>
                <tr>
                  <th scope="col" className="cal-name">{labels.discipline}</th>
                  {g.days.map((d, i) => {
                    const date = new Date(d + "T00:00:00Z");
                    const first = i === 0 || d.slice(5, 7) !== g.days[i - 1].slice(5, 7);
                    return (
                      <th key={d} scope="col" className={`cal-day${d === today ? " is-today" : ""}${[0, 6].includes(date.getUTCDay()) ? " is-weekend" : ""}`}>
                        <span className="cal-mon">{first ? mon.format(date) : " "}</span>
                        <span className="cal-wd">{wd.format(date)}</span>
                        <span className="cal-num">{date.getUTCDate()}</span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {g.rows.map((r) => (
                  <tr key={r.id}>
                    <th scope="row" className="cal-name">
                      <span className="cal-label">{r.label}</span>
                      {r.venue && <span className="cal-venue">{r.venueSlug ? <Link prefetch={false} href={`/venues/${r.venueSlug}`}>{r.venue}</Link> : r.venue}</span>}
                    </th>
                    {g.days.map((d) => {
                      const c = r.days[d];
                      return <td key={d} className={`${d === today ? "is-today " : ""}${c ? `cal-${c}` : ""}`} title={c ? `${r.label} · ${d} · ${labels.legend[c]}` : undefined}>{c === "P" ? "●" : ""}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      <ul className="cal-legend small" aria-label="Legend">
        {(["X", "F", "M", "P", "T", "C"] as DayCode[]).filter((c) => used.has(c)).map((c) => (
          <li key={c}><span className={`cal-swatch cal-${c}`}>{c === "P" ? "●" : ""}</span>{labels.legend[c]}</li>
        ))}
      </ul>
      <p className="muted small" style={{ margin: 0 }}>{labels.note}</p>
    </div>
  );
}
