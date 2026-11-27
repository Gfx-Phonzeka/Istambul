import { isAdmin } from "@/lib/auth";
import { requireCrew } from "@/lib/crew-server";
import { loadCrew } from "@/lib/crew-data";
import { getT } from "@/lib/i18n/server";
import { crewDict, crewLabels } from "@/lib/crew";
import { addAssignment, deleteAssignment, deleteTeam } from "@/lib/actions/crew";
import { DAY_CODE, loadPlan } from "@/lib/crew-days";
import { venueSportNames } from "@/lib/crew-refs";
import { CrewForm } from "@/components/crew/CrewForm";
import { PeriodFields } from "@/components/crew/DayFields";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { CrewTabs } from "@/components/crew/CrewTabs";
import { AddTeamForm } from "@/components/crew/CrewAdminForms";

export const metadata = { title: "Crew Ops · Teams" };

export default async function CrewTeamsPage() {
  const me = await requireCrew();
  const { locale } = await getT();
  const c = crewLabels(locale);
  const [{ people, teams }, plan, { V }] = await Promise.all([loadCrew(locale), loadPlan(), venueSportNames(locale)]);
  const U = new Map(plan.units.map((u) => [u.id, u.code]));
  return (
    <div className="stack">
      <PageHeader title={c("crewOps")} subtitle={c("teamsIntro")} />
      <CrewTabs active="teams" c={c} admin={isAdmin(me)} />
      <Card title={c("addTeam")}><AddTeamForm L={crewDict(locale)} /></Card>
      {teams.length > 0 && (
        <Card title={c("noUnitWork")}>
          <p className="muted small" style={{ marginTop: 0 }}>{c("noUnitHelp")}</p>
          <CrewForm action={addAssignment} saved={c("saved")} error={c("error")}>
            <select name="team_id" className="input" required aria-label={c("team")} defaultValue="">
              <option value="" disabled>{c("team")}</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name} · {c(t.kind)}</option>)}
            </select>
            <PeriodFields c={c} defaultType="office" />
            <select name="venue_id" className="input" aria-label={c("venue")} defaultValue=""><option value="">{c("venue")}</option>{[...V].map(([id, n]) => <option key={id} value={id}>{n}</option>)}</select>
            <button className="btn btn-sm btn-primary">{c("addPeriod")}</button>
          </CrewForm>
        </Card>
      )}
      <Card title={`${c("teamsTitle")} (${teams.length})`}>
        {teams.length === 0 ? <EmptyState icon="users">—</EmptyState> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>{c("teamName")}</th><th>{c("teamKind")}</th><th>{c("people")}</th><th>{c("assignments")}</th><th /></tr></thead>
              <tbody>
                {teams.map((t) => {
                  const ms = people.filter((p) => p.teamIds.includes(t.id));
                  return (
                    <tr key={t.id}>
                      <td><strong>{t.name}</strong>{t.notes ? <div className="muted small">{t.notes}</div> : null}</td>
                      <td><Badge tone={t.kind === "technical" ? "info" : t.kind === "operational" ? "primary" : "neutral"}>{c(t.kind)}</Badge></td>
                      <td className="small">{ms.length ? ms.map((p) => `${p.first_name} ${p.last_name}${p.functionName ? ` (${p.functionName})` : ""}`).join(", ") : "—"}</td>
                      <td className="small">{plan.assignments.filter((a) => a.team_id === t.id).map((a) => (
                        <div key={a.id} className="row" style={{ gap: 6 }}>
                          <span>{a.unit_id ? U.get(a.unit_id) : <><span className={`dt dt-${a.day_type}`}>{DAY_CODE[a.day_type]}</span> {c("withoutUnit")}</>} · {a.start_date.slice(5)} → {a.end_date.slice(5)}</span>
                          <ConfirmButton className="btn btn-sm btn-ghost" message={c("remove")} confirmLabel={c("remove")} onConfirm={deleteAssignment.bind(null, a.id)}>✕</ConfirmButton>
                        </div>
                      ))}</td>
                      <td><ConfirmButton className="btn btn-sm" message={c("confirmDelete")} confirmLabel={c("delete")} onConfirm={deleteTeam.bind(null, t.id)}>{c("delete")}</ConfirmButton></td>
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
