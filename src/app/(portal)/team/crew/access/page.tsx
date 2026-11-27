import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { crewDict, crewLabels } from "@/lib/crew";
import { Card, PageHeader } from "@/components/ui";
import { CrewTabs } from "@/components/crew/CrewTabs";
import { AccessSelect } from "@/components/crew/CrewAdminForms";

export const metadata = { title: "Crew Ops · Access" };

/** Admins choose who besides them manages Crew Ops: people of the team (coordination) or of controlling/finance. */
export default async function CrewAccessPage() {
  await requireAdmin();
  const { t, locale } = await getT();
  const c = crewLabels(locale);
  const supabase = await createClient();
  const [{ data: users }, { data: staff }] = await Promise.all([
    supabase.from("profiles").select("id,first_name,last_name,email,role,organization").eq("status", "approved").neq("role", "admin").order("last_name"),
    supabase.from("crew_staff").select("profile_id,level"),
  ]);
  const S = new Map((staff ?? []).map((s) => [s.profile_id, s.level]));
  const L = crewDict(locale);
  const rows = (users ?? []).sort((a, b) => Number(S.has(b.id)) - Number(S.has(a.id)));
  return (
    <div className="stack">
      <PageHeader title={c("crewOps")} subtitle={c("accessIntro")} />
      <CrewTabs active="access" c={c} admin />
      <Card title={c("access")}>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>{c("name")}</th><th>{t("admin.createUser.role")}</th><th>{c("access")}</th></tr></thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.first_name} {u.last_name}</strong><div className="muted small">{u.email} · {u.organization}</div></td>
                  <td className="small">{t(`admin.roles.${u.role}`)}</td>
                  <td style={{ minWidth: 160 }}><AccessSelect id={u.id} level={S.get(u.id) ?? "none"} L={L} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
