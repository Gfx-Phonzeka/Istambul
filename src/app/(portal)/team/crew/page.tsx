import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { requireCrew } from "@/lib/crew-server";
import { loadCrew } from "@/lib/crew-data";
import { getT } from "@/lib/i18n/server";
import { crewLabels } from "@/lib/crew";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { CrewTabs } from "@/components/crew/CrewTabs";

export const metadata = { title: "Crew Ops" };

export default async function CrewPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireCrew();
  const sp = await searchParams;
  const { locale } = await getT();
  const c = crewLabels(locale);
  const { people, functions, teams, fname } = await loadCrew(locale);
  const q = (sp.q ?? "").toLowerCase().trim();
  const list = people.filter((p) =>
    (!q || `${p.first_name} ${p.last_name} ${p.email}`.toLowerCase().includes(q)) &&
    (!sp.team || p.teamIds.includes(sp.team)) &&
    (!sp.fn || p.function_id === sp.fn) &&
    (!sp.missing || p.pct < 100));
  const exp = (kind: string, label: string) => <a className="btn btn-sm" href={`/api/crew/export?kind=${kind}`}>{label}</a>;
  return (
    <div className="stack">
      <PageHeader title={c("crewOps")} subtitle={c("crewIntro")} />
      <CrewTabs active="people" c={c} admin={isAdmin(me)} />
      <Card title={`${c("people")} (${list.length})`} actions={<div className="crew-actions">{exp("full", c("exportFull"))}{exp("contacts", c("exportContacts"))}{exp("uniforms", c("exportUniforms"))}{exp("accreditation", c("exportAccreditation"))}</div>}>
        <form className="crew-filters" method="get">
          <input name="q" className="input" placeholder={c("search")} defaultValue={sp.q ?? ""} aria-label={c("search")} />
          <select name="team" className="input" defaultValue={sp.team ?? ""} aria-label={c("teams")}>
            <option value="">{c("allTeams")}</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select name="fn" className="input" defaultValue={sp.fn ?? ""} aria-label={c("function")}>
            <option value="">{c("allFunctions")}</option>
            {functions.map((f) => <option key={f.id} value={f.id}>{fname(f)}</option>)}
          </select>
          <label className="crew-check"><input type="checkbox" name="missing" value="1" defaultChecked={!!sp.missing} /> {c("missing")}</label>
          <button className="btn btn-sm">{c("filter")}</button>
        </form>
        {list.length === 0 ? <EmptyState icon="users">{c("noPeople")}</EmptyState> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>{c("name")}</th><th>{c("function")}</th><th>{c("teams")}</th><th>{c("type")}</th><th>{c("data")}</th><th /></tr></thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.first_name} {p.last_name}</strong><div className="muted small">{p.email}{p.phone ? ` · ${p.phone}` : ""}</div></td>
                    <td className="small">{p.functionName ?? "—"}{p.position_label ? <div className="muted">{p.position_label}</div> : null}</td>
                    <td className="small">{p.teamNames.join(", ") || "—"}</td>
                    <td className="small">{p.collaborator_type ? c(p.collaborator_type) : "—"}{p.company ? <div className="muted">{p.company}</div> : null}</td>
                    <td><Badge tone={p.pct === 100 ? "success" : p.pct >= 50 ? "warning" : "danger"}>{p.pct}%</Badge></td>
                    <td><Link className="btn btn-sm" href={`/team/crew/${p.id}`}>{c("edit")}</Link></td>
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
