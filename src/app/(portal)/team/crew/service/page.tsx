import { isAdmin } from "@/lib/auth";
import { requireCrew } from "@/lib/crew-server";
import { getT } from "@/lib/i18n/server";
import { crewLabels } from "@/lib/crew";
import { DAY_CODE, loadPlan, personDays, planRange } from "@/lib/crew-days";
import { loadCrew } from "@/lib/crew-data";
import { venueSportNames } from "@/lib/crew-refs";
import { formatDate } from "@/lib/format";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { CrewTabs } from "@/components/crew/CrewTabs";
import { PrintButton } from "@/components/crew/PrintButton";

export const metadata = { title: "Crew Ops · Service sheet" };

/** Daily service sheet: for one day, each unit with its venue, sport, call time and the people working on it. */
export default async function CrewServicePage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const me = await requireCrew();
  const sp = await searchParams;
  const { locale } = await getT();
  const c = crewLabels(locale);
  const [plan, { people }, { V, S }] = await Promise.all([loadPlan(), loadCrew(locale), venueSportNames(locale)]);
  const range = planRange(plan);
  const today = new Date().toISOString().slice(0, 10);
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : range && (today < range[0] || today > range[1]) ? range[0] : today;
  const byPerson = people.map((p) => ({ p, d: personDays(plan, p.id).get(date) })).filter((x) => x.d);
  const units = plan.units.map((u) => ({ u, day: plan.unitDays.find((d) => d.unit_id === u.id && d.day === date), crew: byPerson.filter((x) => x.d!.unitId === u.id) }))
    .filter((x) => x.day || x.crew.length);
  const others = byPerson.filter((x) => !x.d!.unitId);
  return (
    <div className="stack">
      <PageHeader title={c("serviceTitle")} subtitle={c("serviceIntro")} actions={<PrintButton label={c("print")} />} />
      <div className="no-print"><CrewTabs active="service" c={c} admin={isAdmin(me)} /></div>
      <form className="crew-filters no-print" method="get">
        <input type="date" name="date" className="input" defaultValue={date} aria-label={c("from")} style={{ maxWidth: 200 }} />
        <button className="btn btn-sm">{c("show")}</button>
      </form>
      <h2 style={{ margin: 0 }}>{formatDate(`${date}T12:00:00Z`, locale, "UTC")}</h2>
      {units.length === 0 && others.length === 0 ? <Card><EmptyState icon="calendar">{c("noService")}</EmptyState></Card> : null}
      {units.map(({ u, day, crew }) => (
        <Card key={u.id} title={<>{u.code}{day ? <> · <span className={`dt dt-${day.day_type}`}>{DAY_CODE[day.day_type]}</span></> : null}</>}>
          <p style={{ marginTop: 0 }}>
            {[day?.venue_id && V.get(day.venue_id), day?.sport_id && S.get(day.sport_id)].filter(Boolean).join(" · ") || "—"}
            {day?.call_time ? <> · <strong>{c("callTime")}: {day.call_time}</strong></> : null}
            {day?.notes ? <span className="muted"> · {day.notes}</span> : null}
          </p>
          <ServiceTable crew={crew} c={c} />
        </Card>
      ))}
      {others.length > 0 && <Card title={c("people")}><ServiceTable crew={others} c={c} /></Card>}
    </div>
  );
}

function ServiceTable({ crew, c }: { crew: { p: { id: string; first_name: string; last_name: string; phone: string | null; functionName: string | null; position_label: string | null }; d?: { type: keyof typeof DAY_CODE; manual: boolean; note: string | null } }[]; c: (k: string) => string }) {
  if (!crew.length) return <p className="muted small" style={{ margin: 0 }}>—</p>;
  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr><th>{c("function")}</th><th>{c("name")}</th><th>{c("dayType")}</th><th>{c("emergency_phone")}</th></tr></thead>
        <tbody>
          {crew.map(({ p, d }) => (
            <tr key={p.id}>
              <td className="small">{p.functionName ?? "—"}{p.position_label ? <div className="muted">{p.position_label}</div> : null}</td>
              <td><strong>{p.first_name} {p.last_name}</strong></td>
              <td>{d ? <><span className={`dt dt-${d.type}`}>{DAY_CODE[d.type]}</span>{d.manual ? " ✎" : ""}{d.note ? <span className="muted small"> {d.note}</span> : null}</> : null}</td>
              <td className="small">{p.phone ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
