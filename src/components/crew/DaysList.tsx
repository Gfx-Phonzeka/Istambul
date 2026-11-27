import { DAY_CODE, type PersonDay } from "@/lib/crew-days";

/** One person's days, as a compact list (date · code · unit · venue/sport · call time). */
export function DaysList({ days, c, U, V, S, fmt }: {
  days: PersonDay[]; c: (k: string) => string; U: Map<string, string>; V: Map<string, string>; S: Map<string, string>; fmt: (d: string) => string;
}) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr><th>{c("from")}</th><th>{c("dayType")}</th><th>{c("unit")}</th><th>{c("venue")} · {c("sport")}</th><th>{c("callTime")}</th></tr></thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.day}>
              <td className="small">{fmt(d.day)}</td>
              <td><span className={`dt dt-${d.type}`}>{DAY_CODE[d.type]}</span> <span className="small muted">{c(`dayTypes_${d.type}`)}{d.manual ? ` ✎ ${c("exceptionMark")}` : ""}</span>{d.note ? <div className="small muted">{d.note}</div> : null}</td>
              <td className="small">{d.unitId ? U.get(d.unitId) : "—"}</td>
              <td className="small">{[d.venueId && V.get(d.venueId), d.sportId && S.get(d.sportId)].filter(Boolean).join(" · ") || "—"}</td>
              <td className="small">{d.call ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
