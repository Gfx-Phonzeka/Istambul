import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { Card, PageHeader, Tabs } from "@/components/ui";
import { BarList, ColumnChart } from "@/components/admin/BarList";

export const metadata = { title: "Statistics" };

type Row = { label: string; n: number; users?: number; watched?: number };
interface Stats {
  users_total: number; users_pending: number; by_country: Row[]; by_org: Row[]; by_role: Row[]; logins_total: number; logins_unique: number;
  logins_by_day: { day: string; n: number }[]; top_downloads: Row[]; downloads_total: number; top_videos: Row[]; top_pages: Row[]; requests_by_status: Row[];
}

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireAdmin();
  const { days: d } = await searchParams;
  const days = [7, 30, 90].includes(Number(d)) ? Number(d) : 30;
  const { t, locale } = await getT();
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_stats", { p_days: days });
  const s = data as Stats;
  const dayLabel = (k: string) => new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${k}T12:00:00Z`));
  const tile = (label: string, value: number) => (
    <div className="card stat-tile"><div className="muted small">{label}</div><div className="stat-value">{value}</div></div>
  );
  return (
    <div className="stack">
      <PageHeader title={t("stats.title")} subtitle={t("stats.subtitle")} />
      <Tabs items={[7, 30, 90].map((n) => ({ href: `/admin/stats?days=${n}`, label: t("stats.lastDays", { n }), active: days === n }))} />
      <div className="grid grid-4">
        {tile(t("stats.users"), s.users_total)}
        {tile(t("stats.pending"), s.users_pending)}
        {tile(t("stats.logins", { n: days }), s.logins_total)}
        {tile(t("stats.activeUsers", { n: days }), s.logins_unique)}
        {tile(t("stats.downloads", { n: days }), s.downloads_total)}
      </div>
      <Card title={t("stats.loginsPerDay")}><ColumnChart rows={s.logins_by_day} label={dayLabel} /></Card>
      <div className="grid grid-2">
        <Card title={t("stats.byCountry")}><BarList rows={s.by_country} empty="—" /></Card>
        <Card title={t("stats.byOrg")}><BarList rows={s.by_org} empty="—" /></Card>
        <Card title={t("stats.topDownloads")}><BarList rows={s.top_downloads.map((r) => ({ ...r, extra: t("stats.uniqueUsers", { n: r.users ?? 0 }) }))} empty={t("stats.noData")} /></Card>
        <Card title={t("stats.topVideos")}><BarList rows={s.top_videos.map((r) => ({ ...r, extra: t("stats.watchedBy", { n: r.watched ?? 0 }) }))} empty={t("stats.noData")} /></Card>
        <Card title={t("stats.topPages")}><BarList rows={s.top_pages.map((r) => ({ ...r, extra: t("stats.uniqueUsers", { n: r.users ?? 0 }) }))} empty={t("stats.noData")} /></Card>
        <Card title={t("stats.byRole")}><BarList rows={s.by_role.map((r) => ({ ...r, label: t(`admin.roles.${r.label}`) }))} empty="—" /></Card>
        <Card title={t("stats.requests")}><BarList rows={s.requests_by_status.map((r) => ({ ...r, label: t(`requests.status.${r.label}`) }))} empty={t("stats.noData")} /></Card>
      </div>
    </div>
  );
}
