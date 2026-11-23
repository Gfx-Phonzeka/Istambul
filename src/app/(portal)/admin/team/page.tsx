import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { tx, cols } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { InviteButton, TeamImport } from "@/components/admin/TeamImport";

export const metadata = { title: "Production team" };

export default async function AdminTeamPage() {
  await requireAdmin();
  const { t, locale } = await getT();
  const supabase = await createClient();
  const [{ data: team }, { data: venues }, { data: sports }] = await Promise.all([
    supabase.from("profiles").select("id,email,first_name,last_name,team_function,phone,team_venue_id,team_sport_id,last_login_at,status")
      .eq("role", "production").order("last_name"),
    supabase.from("venues").select(`id,${cols("title")}` as "*"),
    supabase.from("sports").select(`id,${cols("title")}` as "*"),
  ]);
  const V = new Map((venues ?? []).map((v) => [v.id, tx(v, "title", locale)]));
  const S = new Map((sports ?? []).map((s) => [s.id, tx(s, "title", locale)]));
  const neverIn = (team ?? []).filter((m) => !m.last_login_at).map((m) => m.id);
  return (
    <div className="stack">
      <PageHeader title={t("team.admin.title")} subtitle={t("team.admin.subtitle")} />
      <Card title={t("team.admin.importTitle")}>
        <p className="muted small" style={{ marginTop: 0 }}>{t("team.admin.importHelp")}</p>
        <TeamImport />
      </Card>
      <Card title={`${t("team.admin.members")} (${(team ?? []).length})`} actions={<InviteButton ids={neverIn} label={t("team.admin.inviteAll", { n: neverIn.length })} variant="btn-sm btn-primary" />}>
        <p className="muted small" style={{ marginTop: 0 }}>{t("team.admin.inviteHelp")}</p>
        {(team ?? []).length === 0 ? <EmptyState icon="users">{t("team.admin.none")}</EmptyState> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>{t("cms.fields.name")}</th><th>{t("team.function")}</th><th>{t("schedule.venue")} · {t("venues.sport")}</th><th>{t("team.admin.lastLogin")}</th><th /></tr></thead>
              <tbody>
                {(team ?? []).map((m) => (
                  <tr key={m.id}>
                    <td><strong>{m.first_name} {m.last_name}</strong><div className="muted small">{m.email}{m.phone ? ` · ${m.phone}` : ""}</div></td>
                    <td>{m.team_function ?? "—"}</td>
                    <td className="small">{[m.team_venue_id && V.get(m.team_venue_id), m.team_sport_id && S.get(m.team_sport_id)].filter(Boolean).join(" · ") || "—"}</td>
                    <td className="small">{m.last_login_at ? formatDateTime(m.last_login_at, locale) : <span className="muted">{t("team.admin.never")}</span>}</td>
                    <td><InviteButton ids={[m.id]} label={m.last_login_at ? t("team.admin.resend") : t("team.admin.invite")} /></td>
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
