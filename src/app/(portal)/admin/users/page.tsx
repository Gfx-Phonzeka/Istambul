import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { formatDate, formatDateTime } from "@/lib/format";
import { Badge, EmptyState, PageHeader, Tabs } from "@/components/ui";
import { UserActions, type AdminUserRow } from "./UserActions";

export const metadata = { title: "Users" };

const TABS = ["pending", "approved", "suspended", "rejected", "all"] as const;
const tone = (s: string) => (s === "approved" ? "success" : s === "pending" ? "warning" : s === "suspended" ? "danger" : "neutral") as "success" | "warning" | "danger" | "neutral";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const me = await requireAdmin();
  const { status = "pending", q = "" } = await searchParams;
  const current = (TABS as readonly string[]).includes(status) ? status : "pending";
  const { t, locale } = await getT();
  const supabase = await createClient();

  let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });
  if (current !== "all") query = query.eq("status", current);
  if (q.trim()) {
    const s = q.trim().replace(/[%,()]/g, "");
    query = query.or(`email.ilike.%${s}%,first_name.ilike.%${s}%,last_name.ilike.%${s}%,organization.ilike.%${s}%,country.ilike.%${s}%`);
  }
  const { data } = await query;
  const users = (data ?? []) as AdminUserRow[];

  const { data: counts } = await supabase.from("profiles").select("status");
  const count = (s: string) => (counts ?? []).filter((r) => s === "all" || r.status === s).length;

  return (
    <div className="stack">
      <PageHeader
        title={t("admin.users")}
        actions={<a className="btn" href={`/api/admin/users/export?status=${current}`}>{t("admin.exportExcel")}</a>}
      />
      <Tabs items={TABS.map((s) => ({ href: `/admin/users?status=${s}`, label: `${t(`admin.tabs.${s}`)} (${count(s)})`, active: s === current }))} />
      <form className="row" role="search">
        <input type="hidden" name="status" value={current} />
        <input name="q" type="search" className="input" defaultValue={q} placeholder={t("common.search")} style={{ flex: 1, minWidth: 0 }} />
        <button className="btn">{t("common.search")}</button>
      </form>
      {users.length === 0 ? (
        <div className="card"><EmptyState icon="users">{t("admin.noUsers")}</EmptyState></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t("admin.columns.name")}</th>
                <th>{t("admin.columns.organization")}</th>
                <th>{t("admin.columns.country")}</th>
                <th>{t("common.role")}</th>
                <th>{t("common.status")}</th>
                <th>{t("admin.columns.registered")}</th>
                <th>{t("admin.columns.lastLogin")}</th>
                <th>{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.first_name} {u.last_name}</strong>{u.id === me.id && <span className="muted"> ({t("admin.you")})</span>}
                    <div className="muted">{u.email}</div>
                    {u.deletion_requested_at && <Badge tone="danger">{t("admin.deletionRequested")}</Badge>}
                  </td>
                  <td>{u.organization}<div className="muted">{t(`auth.orgTypes.${u.org_type}`)}</div></td>
                  <td>{u.country}</td>
                  <td>{u.role ? t(`admin.roles.${u.role}`) : "—"}</td>
                  <td><Badge tone={tone(u.status)}>{t(`admin.statuses.${u.status}`)}</Badge></td>
                  <td>{formatDate(u.created_at, locale)}</td>
                  <td>{u.last_login_at ? formatDateTime(u.last_login_at, locale) : t("admin.never")}</td>
                  <td><UserActions user={u} isSelf={u.id === me.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
