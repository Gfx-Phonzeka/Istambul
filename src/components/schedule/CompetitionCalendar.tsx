import Link from "next/link";

// Competition calendar by day, without session times: one row per discipline (discipline · location · venue),
// one tile per day, coloured when there is competition (women / men / mixed) or a ceremony.
export type DayCode = "X" | "F" | "M" | "P" | "T" | "C";
export interface CalendarRow { id: string; label: string; location: string; venue: string; venueSlug: string | null; days: Record<string, DayCode> }
export interface CalendarGroup { key: string; title: string; days: string[]; rows: CalendarRow[] }

const LEGEND_ORDER: DayCode[] = ["X", "F", "M", "P", "T", "C"];

export function CompetitionCalendar({ groups, today, intl, labels }: {
  groups: CalendarGroup[];
  today: string;
  intl: string;
  labels: { cols: { discipline: string; location: string; venue: string }; legend: Record<DayCode, string>; note: string; subjectToChange: string };
}) {
  const used = new Set(groups.flatMap((g) => g.rows.flatMap((r) => Object.values(r.days))));
  const month = new Intl.DateTimeFormat(intl, { month: "long", timeZone: "UTC" });
  const year = new Intl.DateTimeFormat(intl, { year: "numeric", timeZone: "UTC" });
  const wd = new Intl.DateTimeFormat(intl, { weekday: "short", timeZone: "UTC" });
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const period = (days: string[]) => {
    if (!days.length) return "";
    const a = new Date(days[0] + "T00:00:00Z"), b = new Date(days[days.length - 1] + "T00:00:00Z");
    const m = [...new Set([month.format(a), month.format(b)])].map(cap).join(" – ");
    return `${m} ${year.format(b)}`;
  };
  const showLocation = groups.some((g) => g.rows.some((r) => r.location));
  return (
    <div className="stack">
      {groups.map((g) => (
        <section key={g.key} className="card cal-card" aria-labelledby={`cal-${g.key}`}>
          <header className="cal-head">
            <h2 id={`cal-${g.key}`}>{g.title}</h2>
            <span className="cal-period">{period(g.days)}</span>
          </header>
          <div className="cal-scroll" tabIndex={0} role="region" aria-label={g.title}>
            <table className="cal-grid">
              <thead>
                <tr>
                  <th scope="col" className="cal-name">{labels.cols.discipline}</th>
                  {showLocation && <th scope="col" className="cal-loc">{labels.cols.location}</th>}
                  <th scope="col" className="cal-venue">{labels.cols.venue}</th>
                  {g.days.map((d, i) => {
                    const date = new Date(d + "T00:00:00Z");
                    const newMonth = i > 0 && d.slice(5, 7) !== g.days[i - 1].slice(5, 7);
                    return (
                      <th key={d} scope="col" title={`${wd.format(date)} ${date.getUTCDate()} ${month.format(date)}`}
                        className={`cal-day${d === today ? " is-today" : ""}${newMonth ? " is-month" : ""}${[0, 6].includes(date.getUTCDay()) ? " is-weekend" : ""}`}>
                        {date.getUTCDate()}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {g.rows.map((r) => (
                  <tr key={r.id}>
                    <th scope="row" className="cal-name">{r.label}</th>
                    {showLocation && <td className="cal-loc">{r.location}</td>}
                    <td className="cal-venue">{r.venueSlug ? <Link prefetch={false} href={`/venues/${r.venueSlug}`}>{r.venue}</Link> : r.venue}</td>
                    {g.days.map((d, i) => {
                      const c = r.days[d];
                      const newMonth = i > 0 && d.slice(5, 7) !== g.days[i - 1].slice(5, 7);
                      return (
                        <td key={d} className={`cal-cell${d === today ? " is-today" : ""}${newMonth ? " is-month" : ""}`}>
                          <span className={`cal-tile${c ? ` cal-${c}` : ""}`} title={c ? `${r.label} · ${d} · ${labels.legend[c]}` : undefined}>
                            {c ? <span className="sr-only">{labels.legend[c]}</span> : null}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      <div className="row-between" style={{ flexWrap: "wrap", gap: "var(--space-2)" }}>
        <ul className="cal-legend small" aria-label="Legend">
          {LEGEND_ORDER.filter((c) => used.has(c)).map((c) => (
            <li key={c}><span className={`cal-tile cal-${c}`} aria-hidden="true" />{labels.legend[c]}</li>
          ))}
        </ul>
        <span className="muted small"><em>{labels.subjectToChange}</em></span>
      </div>
      <p className="muted small" style={{ margin: 0 }}>{labels.note}</p>
    </div>
  );
}
