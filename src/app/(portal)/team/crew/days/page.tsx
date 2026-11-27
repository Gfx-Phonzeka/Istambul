import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { requireCrew } from "@/lib/crew-server";
import { getT } from "@/lib/i18n/server";
import { crewLabels } from "@/lib/crew";
import { DAY_CODE, eachDay, loadPlan, personDays, planRange } from "@/lib/crew-days";
import { loadCrew } from "@/lib/crew-data";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { CrewTabs } from "@/components/crew/CrewTabs";

export const metadata = { title: "Crew Ops · Days" };
const wd = (d: string, locale: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale, { weekday: "short", timeZone: "UTC" });

/** The crew control grid: one row per person, one column per day. */
export default async function CrewDaysPage({ searchParams }: { searchParams: Promise<{ team?: string; unit?: string }> }) {
  const me = await requireCrew();
  const sp = await searchParams;
  const { locale } = await getT();
  const c = crewLabels(locale);
  const [plan, { people, teams }] = await Promise.all([loadPlan(), loadCrew(locale)]);
  const range = planRange(plan);
  const U = new Map(plan.units.map((u) => [u.id, u.code]));
  const rows = people
    .filter((p) => !sp.team || p.teamIds.includes(sp.team))
    .map((p) => ({ p, days: personDays(plan, p.id) }))
    .filter((r) => !sp.unit || [...r.days.values()].some((d) => d.unitId === sp.unit));
  const dates = range ? eachDay(range[0], range[1]) : [];
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]).toString();
  return (
    <div className="stack">
      <PageHeader title={c("crewOps")} subtitle={c("gridHelp")} />
      <CrewTabs active="days" c={c} admin={isAdmin(me)} />
      <Card title={c("grid")} actions={<a className="btn btn-sm" href={`/api/crew/export?kind=days${qs ? `&${qs}` : ""}`}>{c("exportDays")}</a>}>
        <form className="crew-filters" method="get">
          <select name="team" className="input" defaultValue={sp.team ?? ""} aria-label={c("team")}><option value="">{c("allTeams")}</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
          <select name="unit" className="input" defaultValue={sp.unit ?? ""} aria-label={c("unit")}><option value="">{c("allUnits")}</option>{plan.units.map((u) => <option key={u.id} value={u.id}>{u.code}</option>)}</select>
          <button className="btn btn-sm">{c("show")}</button>
        </form>
        {dates.length === 0 || rows.length === 0 ? <EmptyState icon="calendar">{c("noPlan")}</EmptyState> : (
          <div className="crew-grid-wrap">
            <table className="crew-days">
              <thead>
                <tr>
                  <th className="crew-days-name">{c("name")}</th>
                  {dates.map((d) => <th key={d}><span>{wd(d, locale)}</span><br />{d.slice(8)}/{d.slice(5, 7)}</th>)}
                  <th>{c("total")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ p, days }) => (
                  <tr key={p.id}>
                    <th className="crew-days-name"><Link href={`/team/crew/${p.id}`}>{p.first_name} {p.last_name}</Link><div className="muted small">{p.functionName ?? ""}</div></th>
                    {dates.map((d) => {
                      const x = days.get(d);
                      return <td key={d} className={x ? `dt-${x.type}` : ""} title={x ? `${c(`dayTypes_${x.type}`)}${x.unitId ? ` · ${U.get(x.unitId)}` : ""}${x.note ? ` · ${x.note}` : ""}` : ""}>
                        {x ? <>{DAY_CODE[x.type]}{x.manual ? "✎" : ""}{x.unitId ? <div className="crew-days-unit">{U.get(x.unitId)}</div> : null}</> : ""}
                      </td>;
                    })}
                    <td><strong>{days.size}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
