import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { requireCrew, isCrewFinance } from "@/lib/crew-server";
import { getT } from "@/lib/i18n/server";
import { crewLabels } from "@/lib/crew";
import { loadCrew } from "@/lib/crew-data";
import { DAY_CODE, eachDay, loadPlan, personDays, planRange, type DayType } from "@/lib/crew-days";
import { loadLogistics } from "@/lib/crew-logistics";
import { loadFinance, personCost } from "@/lib/crew-costs";
import { Card, PageHeader } from "@/components/ui";
import { CrewTabs } from "@/components/crew/CrewTabs";

export const metadata = { title: "Crew Ops · Overview" };

/** Crew Ops dashboard: general status for the coordination (costs only for finance). */
export default async function CrewOverviewPage() {
  const me = await requireCrew();
  const { locale } = await getT();
  const c = crewLabels(locale);
  const finance = await isCrewFinance();
  const [{ people, teams }, plan, logi] = await Promise.all([loadCrew(locale), loadPlan(), loadLogistics()]);
  const daysOf = new Map(people.map((p) => [p.id, personDays(plan, p.id)]));
  const n = people.length;
  const complete = people.filter((p) => p.pct === 100).length;
  const noPhoto = people.filter((p) => !p.record?.photo_path).length;
  const noTeam = people.filter((p) => !p.teamIds.length);
  const noDays = people.filter((p) => !daysOf.get(p.id)!.size);
  const mediagest = people.filter((p) => p.in_mediagest).length;
  const withDays = people.filter((p) => daysOf.get(p.id)!.size);
  const noOut = withDays.filter((p) => !logi.travels.some((t) => t.profile_id === p.id && t.direction === "outbound"));
  const noRet = withDays.filter((p) => !logi.travels.some((t) => t.profile_id === p.id && t.direction === "return"));
  const noHotel = withDays.filter((p) => !logi.stays.some((s) => s.profile_id === p.id));
  const personDaysTotal = [...daysOf.values()].reduce((s, m) => s + m.size, 0);
  const byType = new Map<DayType, number>();
  for (const m of daysOf.values()) for (const d of m.values()) byType.set(d.type, (byType.get(d.type) ?? 0) + 1);
  const range = planRange(plan);
  const dates = range ? eachDay(range[0], range[1]) : [];
  const head = dates.map((d) => ({ d, n: [...daysOf.values()].filter((m) => { const x = m.get(d); return x && x.type !== "off" && x.type !== "standby"; }).length }));
  const maxHead = Math.max(1, ...head.map((h) => h.n));
  const byCollab = new Map<string, number>();
  for (const p of people) byCollab.set(p.collaborator_type ?? "—", (byCollab.get(p.collaborator_type ?? "—") ?? 0) + 1);
  const today = new Date().toISOString().slice(0, 10); const in7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const arrivals = logi.travels.filter((t) => t.direction !== "return" && t.arrive_date && t.arrive_date >= today && t.arrive_date <= in7).length;
  let costTotal: number | null = null;
  if (finance) {
    const fd = await loadFinance();
    costTotal = people.reduce((s, p) => s + personCost(p, plan, fd, logi.travels, logi.stays).total, 0)
      + fd.services.reduce((s, x) => s + Number(x.amount), 0) + fd.other.filter((o) => !o.profile_id).reduce((s, o) => s + Number(o.amount), 0);
  }
  const pct = (x: number) => (n ? Math.round((x / n) * 100) : 0);
  const kpi = (label: string, value: string | number, tone: "" | "warn" | "ok" = "", href?: string) => (
    <div className={`crew-kpi ${tone}`}><span>{label}</span><strong>{value}</strong>{href ? <Link className="small" href={href}>{c("seeList")}</Link> : null}</div>
  );
  const names = (list: typeof people) => list.slice(0, 12).map((p) => `${p.first_name} ${p.last_name}`).join(", ") + (list.length > 12 ? ` +${list.length - 12}` : "");
  return (
    <div className="stack">
      <PageHeader title={c("crewOps")} subtitle={c("dashIntro")} />
      <CrewTabs active="dashboard" c={c} admin={isAdmin(me)} />
      <div className="crew-kpis">
        {kpi(c("kpiPeople"), n)}
        {kpi(c("kpiComplete"), `${complete} (${pct(complete)}%)`, complete === n ? "ok" : "warn", "/team/crew?missing=1")}
        {kpi(c("kpiNoPhoto"), noPhoto, noPhoto ? "warn" : "ok")}
        {kpi(c("kpiNoTeam"), noTeam.length, noTeam.length ? "warn" : "ok")}
        {kpi(c("kpiNoDays"), noDays.length, noDays.length ? "warn" : "ok", "/team/crew/days")}
        {kpi(c("kpiMediagest"), `${mediagest} / ${n}`)}
        {kpi(c("kpiUnits"), plan.units.length)}
        {kpi(c("kpiTeams"), teams.length)}
        {kpi(c("kpiPersonDays"), personDaysTotal)}
        {kpi(c("kpiNoOutbound"), noOut.length, noOut.length ? "warn" : "ok", "/team/crew/travel")}
        {kpi(c("kpiNoReturn"), noRet.length, noRet.length ? "warn" : "ok", "/team/crew/travel")}
        {kpi(c("kpiNoHotel"), noHotel.length, noHotel.length ? "warn" : "ok", "/team/crew/hotels")}
        {kpi(c("upcoming"), arrivals, "", "/team/crew/transfers")}
        {costTotal != null && kpi(c("costTotal"), costTotal.toLocaleString(locale, { style: "currency", currency: "EUR" }), "", "/team/crew/costs")}
      </div>

      <Card title={c("headcount")}>
        {head.length === 0 ? <p className="muted" style={{ margin: 0 }}>{c("noPlan")}</p> : (
          <div className="crew-bars" role="img" aria-label={c("headcount")}>
            {head.map((h) => (
              <div key={h.d} className="crew-bar" title={`${h.d}: ${h.n}`}>
                <span className="crew-bar-n">{h.n || ""}</span>
                <span className="crew-bar-fill" style={{ height: `${(h.n / maxHead) * 100}%` }} />
                <span className="crew-bar-d">{h.d.slice(8)}/{h.d.slice(5, 7)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="crew-two">
        <Card title={c("byDayType")}>
          <ul className="crew-plain">{[...byType].sort((a, b) => b[1] - a[1]).map(([k, v]) => <li key={k}><span><span className={`dt dt-${k}`}>{DAY_CODE[k]}</span> {c(`dayTypes_${k}`)}</span><strong>{v}</strong></li>)}</ul>
        </Card>
        <Card title={c("type")}>
          <ul className="crew-plain">{[...byCollab].map(([k, v]) => <li key={k}><span>{k === "—" ? "—" : c(k)}</span><strong>{v}</strong></li>)}</ul>
        </Card>
      </div>

      {(noTeam.length > 0 || noDays.length > 0 || noOut.length > 0 || noHotel.length > 0) && (
        <Card title={c("attention")}>
          <ul className="stack-sm" style={{ margin: 0, paddingLeft: 18 }}>
            {noTeam.length > 0 && <li><strong>{c("kpiNoTeam")}:</strong> {names(noTeam)}</li>}
            {noDays.length > 0 && <li><strong>{c("kpiNoDays")}:</strong> {names(noDays)}</li>}
            {noOut.length > 0 && <li><strong>{c("kpiNoOutbound")}:</strong> {names(noOut)}</li>}
            {noHotel.length > 0 && <li><strong>{c("kpiNoHotel")}:</strong> {names(noHotel)}</li>}
          </ul>
        </Card>
      )}
    </div>
  );
}
