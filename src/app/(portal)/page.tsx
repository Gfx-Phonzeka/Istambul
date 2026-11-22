import Link from "next/link";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n";
import { formatDate, formatDateTime } from "@/lib/format";
import { Badge, Card, EmptyState, Icon, PageHeader } from "@/components/ui";
import { Countdown } from "@/components/Countdown";
import { ALL_NAV } from "@/lib/nav";
import { excerpt } from "@/lib/content/render";

export const metadata = { title: "Home" };

interface Announcement {
  id: string; title_en: string; title_tr: string | null; body_en: string; body_tr: string | null;
  priority: "normal" | "urgent"; visibility: "all" | "partners" | "internal"; published_at: string | null;
}
interface Deadline { id: string; title_en: string; title_tr: string | null; due_at: string; visibility: string; link: string | null }

export default async function Dashboard() {
  const profile = await requireApproved();
  const { t, locale } = await getT();
  const supabase = await createClient();

  const since = profile.previous_login_at ?? new Date(Date.now() - 14 * 86400000).toISOString();
  const [{ data: opening }, { data: announcements }, { data: deadlines }, { data: changes }] = await Promise.all([
    supabase.from("settings").select("value").eq("key", "opening_ceremony").maybeSingle(),
    supabase.from("announcements").select("*").eq("status", "published").order("published_at", { ascending: false }).limit(6),
    supabase.from("deadlines").select("*").eq("status", "published").gte("due_at", new Date(Date.now() - 86400000).toISOString()).order("due_at").limit(5),
    supabase.from("content_index").select("kind,id,title_en,title_tr,href,published_at,content_updated_at")
      .gt("content_updated_at", since).order("content_updated_at", { ascending: false }).limit(8),
  ]);
  const ceremony = opening?.value as { at: string; label_en: string; label_tr?: string } | undefined;
  const list = (announcements ?? []) as Announcement[];
  const urgent = list.filter((a) => a.priority === "urgent");
  const normal = list.filter((a) => a.priority !== "urgent");
  const visBadge = (v: string) =>
    v === "partners" ? <Badge tone="info">{t("dashboard.partnersOnly")}</Badge> : v === "internal" ? <Badge tone="warning">{t("dashboard.internalOnly")}</Badge> : null;

  return (
    <div className="stack">
      <PageHeader title={t("dashboard.welcome", { name: profile.first_name })} subtitle={`${t("common.games")} · ${t("common.hostBroadcaster")}`} />

      {urgent.map((a) => (
        <div key={a.id} className="urgent-banner" role="alert">
          <span className="urgent-icon" aria-hidden="true"><Icon name="alert" /></span>
          <div className="urgent-body">
            <div className="item-meta">
              <Badge tone="danger">{t("dashboard.urgent")}</Badge>
              {visBadge(a.visibility)}
              <span>{formatDate(a.published_at, locale)}</span>
            </div>
            <Link href={`/news/${a.id}`} className="item-title">{pick(locale, a.title_en, a.title_tr)}</Link>
            <p className="item-excerpt">{excerpt(pick(locale, a.body_en, a.body_tr), 300)}</p>
          </div>
        </div>
      ))}

      {ceremony && (
        <section className="onair" aria-label={t("dashboard.countdownTo")}>
          <div>
            <h2 className="onair-title">{`${t("dashboard.countdownTo")} ${pick(locale, ceremony.label_en, ceremony.label_tr)}`}</h2>
            <p className="onair-meta">{formatDateTime(ceremony.at, locale)} (TRT, UTC+3)</p>
          </div>
          <Countdown target={ceremony.at} />
        </section>
      )}

      <div className="grid grid-2">
        <Card title={t("dashboard.announcements")} actions={<Link href="/news" className="small">{t("common.viewAll")}</Link>}>
          {normal.length === 0 ? (
            <EmptyState icon="megaphone">{t("dashboard.noAnnouncements")}</EmptyState>
          ) : (
            <ul className="list">
              {normal.map((a) => (
                <li key={a.id}>
                  <div className="item-meta">
                    <span>{formatDate(a.published_at, locale)}</span>
                    {visBadge(a.visibility)}
                  </div>
                  <Link href={`/news/${a.id}`} className="item-title">{pick(locale, a.title_en, a.title_tr)}</Link>
                  <p className="item-excerpt">{excerpt(pick(locale, a.body_en, a.body_tr))}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="stack">
          <Card title={t("dashboard.deadlines")}>
            {(deadlines ?? []).length === 0 ? (
              <EmptyState icon="calendar">{t("dashboard.noDeadlines")}</EmptyState>
            ) : (
              <ul className="list">
                {(deadlines as Deadline[]).map((d) => {
                  const days = Math.ceil((new Date(d.due_at).getTime() - Date.now()) / 86400000);
                  return (
                    <li key={d.id} className="deadline">
                      <div className="deadline-main">
                        <div className="item-title">{pick(locale, d.title_en, d.title_tr)}</div>
                        <div className="item-meta">
                          <span>{formatDateTime(d.due_at, locale)}</span>
                          {visBadge(d.visibility)}
                        </div>
                      </div>
                      <Badge tone={days <= 14 ? "warning" : "primary"}>{days >= 0 ? t("dashboard.daysLeft", { n: days }) : t("dashboard.overdue")}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
          <Card title={t("dashboard.whatsNew")}>
            <p className="item-meta" style={{ marginBottom: "var(--space-3)" }}>
              {profile.previous_login_at ? t("dashboard.lastVisit", { date: formatDateTime(profile.previous_login_at, locale) }) : t("dashboard.firstVisit")}
            </p>
            {(changes ?? []).length === 0 ? (
              <p className="item-excerpt" style={{ margin: 0 }}>{t("dashboard.whatsNewSoon")}</p>
            ) : (
              <ul className="list">
                {(changes ?? []).map((c) => (
                  <li key={`${c.kind}-${c.id}`}>
                    <div className="item-meta">
                      <Badge tone={c.published_at && c.published_at > since ? "success" : "info"}>
                        {c.published_at && c.published_at > since ? t("dashboard.isNew") : t("dashboard.isUpdated")}
                      </Badge>
                      <span>{t(`kinds.${c.kind}`)}</span>
                    </div>
                    <Link href={c.href} className="item-title">{pick(locale, c.title_en, c.title_tr)}</Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card title={t("dashboard.shortcuts")}>
        <ul className="shortcut-list">
          {ALL_NAV.filter((n) => n.href !== "/").map((n) => (
            <li key={n.href}>
              <Link href={n.href} className="shortcut">
                <span className="shortcut-icon"><Icon name={n.icon} size={18} /></span>
                <span>
                  <span className="shortcut-title">{t(`nav.${n.key}`)}</span>
                  <span className="shortcut-desc">{t(`sectionInfo.${n.key}`)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <p className="muted small">{t("common.exampleNote")}</p>
    </div>
  );
}
