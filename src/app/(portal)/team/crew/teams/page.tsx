import { isAdmin } from "@/lib/auth";
import { requireCrew } from "@/lib/crew-server";
import { loadCrew } from "@/lib/crew-data";
import { getT } from "@/lib/i18n/server";
import { crewDict, crewLabels } from "@/lib/crew";
import { deleteTeam } from "@/lib/actions/crew";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { CrewTabs } from "@/components/crew/CrewTabs";
import { AddTeamForm } from "@/components/crew/CrewAdminForms";

export const metadata = { title: "Crew Ops · Teams" };

export default async function CrewTeamsPage() {
  const me = await requireCrew();
  const { locale } = await getT();
  const c = crewLabels(locale);
  const { people, teams } = await loadCrew(locale);
  return (
    <div className="stack">
      <PageHeader title={c("crewOps")} subtitle={c("teamsIntro")} />
      <CrewTabs active="teams" c={c} admin={isAdmin(me)} />
      <Card title={c("addTeam")}><AddTeamForm L={crewDict(locale)} /></Card>
      <Card title={`${c("teamsTitle")} (${teams.length})`}>
        {teams.length === 0 ? <EmptyState icon="users">—</EmptyState> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>{c("teamName")}</th><th>{c("teamKind")}</th><th>{c("people")}</th><th /></tr></thead>
              <tbody>
                {teams.map((t) => {
                  const ms = people.filter((p) => p.teamIds.includes(t.id));
                  return (
                    <tr key={t.id}>
                      <td><strong>{t.name}</strong>{t.notes ? <div className="muted small">{t.notes}</div> : null}</td>
                      <td><Badge tone={t.kind === "technical" ? "info" : t.kind === "operational" ? "primary" : "neutral"}>{c(t.kind)}</Badge></td>
                      <td className="small">{ms.length ? ms.map((p) => `${p.first_name} ${p.last_name}${p.functionName ? ` (${p.functionName})` : ""}`).join(", ") : "—"}</td>
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
