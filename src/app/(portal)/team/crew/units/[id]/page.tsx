import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCrew } from "@/lib/crew-server";
import { getT } from "@/lib/i18n/server";
import { crewLabels } from "@/lib/crew";
import { DAY_CODE, loadPlan } from "@/lib/crew-days";
import { venueSportNames } from "@/lib/crew-refs";
import { loadCrew } from "@/lib/crew-data";
import { addAssignment, applyUnitDays, deleteAssignment } from "@/lib/actions/crew";
import { Card, PageHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { CrewForm } from "@/components/crew/CrewForm";
import { PeriodFields } from "@/components/crew/DayFields";

export default async function CrewUnitPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCrew();
  const { id } = await params;
  const { locale } = await getT();
  const c = crewLabels(locale);
  const [plan, { V, S }, { teams, people }] = await Promise.all([loadPlan(), venueSportNames(locale), loadCrew(locale)]);
  const u = plan.units.find((x) => x.id === id);
  if (!u) notFound();
  const days = plan.unitDays.filter((d) => d.unit_id === u.id);
  const asg = plan.assignments.filter((a) => a.unit_id === u.id);
  const T = new Map(teams.map((t) => [t.id, t.name]));
  return (
    <div className="stack">
      <PageHeader title={`${u.code}${u.name ? ` · ${u.name}` : ""}`} subtitle={[u.size, u.mode, u.cameras != null ? `${u.cameras} ${c("cameras").toLowerCase()}` : null].filter(Boolean).join(" · ")}
        actions={<Link className="btn btn-sm" href="/team/crew/units">← {c("tabUnits")}</Link>} />

      <Card title={c("plan")}>
        <p className="muted small" style={{ marginTop: 0 }}>{c("planHelp")}</p>
        <CrewForm action={applyUnitDays} saved={c("saved")} error={c("error")}>
          <input type="hidden" name="unit_id" value={u.id} />
          <PeriodFields c={c} extraTypes={["clear"]} />
          <select name="venue_id" className="input" aria-label={c("venue")} defaultValue=""><option value="">{c("venue")}</option>{[...V].map(([vid, n]) => <option key={vid} value={vid}>{n}</option>)}</select>
          <select name="sport_id" className="input" aria-label={c("sport")} defaultValue=""><option value="">{c("sport")}</option>{[...S].map(([sid, n]) => <option key={sid} value={sid}>{n}</option>)}</select>
          <input name="call_time" type="time" className="input" aria-label={c("callTime")} title={c("callTime")} style={{ maxWidth: 130 }} />
          <input name="notes" className="input" placeholder={c("note")} aria-label={c("note")} maxLength={300} />
          <button className="btn btn-sm btn-primary">{c("apply")}</button>
        </CrewForm>
        {days.length === 0 ? <p className="muted" style={{ marginBottom: 0 }}>{c("noPlan")}</p> : (
          <div className="table-wrap" style={{ marginTop: 12 }}>
            <table className="table">
              <thead><tr><th>{c("from")}</th><th>{c("dayType")}</th><th>{c("venue")} · {c("sport")}</th><th>{c("callTime")}</th><th>{c("note")}</th></tr></thead>
              <tbody>
                {days.map((d) => (
                  <tr key={d.day}>
                    <td className="small">{d.day}</td>
                    <td><span className={`dt dt-${d.day_type}`}>{DAY_CODE[d.day_type]}</span> <span className="small muted">{c(`dayTypes_${d.day_type}`)}</span></td>
                    <td className="small">{[d.venue_id && V.get(d.venue_id), d.sport_id && S.get(d.sport_id)].filter(Boolean).join(" · ") || "—"}</td>
                    <td className="small">{d.call_time ?? "—"}</td>
                    <td className="small">{d.notes ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title={c("assignments")}>
        <p className="muted small" style={{ marginTop: 0 }}>{c("assignHelp")}</p>
        <CrewForm action={addAssignment} saved={c("saved")} error={c("error")}>
          <input type="hidden" name="unit_id" value={u.id} />
          <select name="team_id" className="input" aria-label={c("team")} required defaultValue="">
            <option value="" disabled>{c("team")}</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name} · {c(t.kind)}</option>)}
          </select>
          <label className="crew-inline">{c("from")} <input name="from" type="date" className="input" required /></label>
          <label className="crew-inline">{c("to")} <input name="to" type="date" className="input" required /></label>
          <button className="btn btn-sm btn-primary">{c("assign")}</button>
        </CrewForm>
        {asg.length > 0 && (
          <div className="table-wrap" style={{ marginTop: 12 }}>
            <table className="table">
              <thead><tr><th>{c("team")}</th><th>{c("from")} → {c("to")}</th><th>{c("people")}</th><th /></tr></thead>
              <tbody>
                {asg.map((a) => {
                  const ms = people.filter((p) => p.teamIds.includes(a.team_id));
                  return (
                    <tr key={a.id}>
                      <td><strong>{T.get(a.team_id) ?? "—"}</strong></td>
                      <td className="small">{a.start_date} → {a.end_date}</td>
                      <td className="small">{ms.map((p) => `${p.first_name} ${p.last_name}`).join(", ") || "—"}</td>
                      <td><ConfirmButton className="btn btn-sm" message={c("remove")} confirmLabel={c("remove")} onConfirm={deleteAssignment.bind(null, a.id)}>{c("remove")}</ConfirmButton></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
