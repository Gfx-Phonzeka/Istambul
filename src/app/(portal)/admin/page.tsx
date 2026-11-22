import Link from "next/link";
import { requireStaff, isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { Card, Icon, PageHeader, Alert } from "@/components/ui";

export const metadata = { title: "Backoffice" };

export default async function AdminHome() {
  const profile = await requireStaff();
  const { t } = await getT();
  const admin = isAdmin(profile);
  let pending = 0, approved = 0;
  if (admin) {
    const supabase = await createClient();
    const [p, a] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "approved"),
    ]);
    pending = p.count ?? 0;
    approved = a.count ?? 0;
  }
  const tiles = admin
    ? [
        { href: "/admin/users", icon: "users", label: t("admin.users") },
        { href: "/admin/activity", icon: "activity", label: t("admin.activity") },
        { href: "/admin/emails", icon: "mail", label: t("admin.emails") },
        { href: "/admin/settings", icon: "settings", label: t("admin.settings") },
      ]
    : [];
  return (
    <div className="stack">
      <PageHeader title={t("admin.title")} />
      {admin && pending > 0 && (
        <div className="alert alert-warning row-between">
          <span>{t("admin.pendingCount", { n: pending })}</span>
          <Link href="/admin/users?status=pending" className="btn btn-sm btn-primary">{t("admin.reviewNow")}</Link>
        </div>
      )}
      {admin && (
        <div className="grid grid-4">
          <Card><div className="muted small">{t("admin.tabs.pending")}</div><div className="countdown-value">{pending}</div></Card>
          <Card><div className="muted small">{t("admin.totalUsers")}</div><div className="countdown-value">{approved}</div></Card>
        </div>
      )}
      {!admin && <Alert tone="info">{t("admin.staffOnly")}</Alert>}
      <Link href="/admin/content" className="card card-link row">
        <span className="shortcut-icon"><Icon name="file" /></span>
        <div><strong>{t("cms.title")}</strong><div className="muted small">{t("cms.intro")}</div></div>
      </Link>
      {tiles.length > 0 && (
        <div className="grid grid-4">
          {tiles.map((x) => (
            <Link key={x.href} href={x.href} className="card card-link row">
              <span className="shortcut-icon"><Icon name={x.icon} /></span>
              <strong>{x.label}</strong>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
