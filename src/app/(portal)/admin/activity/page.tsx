import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { formatDateTime } from "@/lib/format";
import { Badge, EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "Activity log" };
const PAGE = 50;

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ page?: string; action?: string }> }) {
  await requireAdmin();
  const { page = "1", action = "" } = await searchParams;
  const p = Math.max(1, parseInt(page) || 1);
  const { t, locale } = await getT();
  const supabase = await createClient();
  let q = supabase.from("activity_log").select("*").order("created_at", { ascending: false }).range((p - 1) * PAGE, p * PAGE);
  if (action) q = q.like("action", `${action.replace(/[%_]/g, "")}%`);
  const { data } = await q;
  const rows = data ?? [];
  const hasMore = rows.length > PAGE;
  const filters = ["", "auth.", "user."];
  return (
    <div className="stack">
      <PageHeader title={t("admin.activity")} />
      <div className="row">
        {filters.map((f) => (
          <Link key={f} href={`/admin/activity${f ? `?action=${f}` : ""}`} className={`btn btn-sm${action === f ? " btn-primary" : ""}`}>
            {f || t("admin.tabs.all")}
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <div className="card"><EmptyState icon="activity">—</EmptyState></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>{t("admin.activityCols.when")}</th><th>{t("admin.activityCols.who")}</th><th>{t("admin.activityCols.action")}</th><th>{t("admin.activityCols.details")}</th></tr></thead>
            <tbody>
              {rows.slice(0, PAGE).map((r) => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{formatDateTime(r.created_at, locale)}</td>
                  <td>{r.actor_email ?? "—"}</td>
                  <td><Badge tone={r.action.startsWith("auth.") ? "info" : "primary"}>{r.action}</Badge></td>
                  <td className="small">{Object.keys(r.details ?? {}).length ? <code>{JSON.stringify(r.details)}</code> : ""}{r.entity_id && r.entity_type === "profile" ? <div className="muted">{r.entity_id}</div> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="row">
        {p > 1 && <Link className="btn btn-sm" href={`/admin/activity?page=${p - 1}${action ? `&action=${action}` : ""}`}>←</Link>}
        {hasMore && <Link className="btn btn-sm" href={`/admin/activity?page=${p + 1}${action ? `&action=${action}` : ""}`}>→</Link>}
      </div>
    </div>
  );
}
