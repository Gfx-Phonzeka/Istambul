import Link from "next/link";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n";
import { formatDate, formatDateTime } from "@/lib/format";
import { Badge, Card, EmptyState, Icon, PageHeader } from "@/components/ui";
import { Countdown } from "@/components/Countdown";
import { ALL_NAV } from "@/lib/nav";

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

  const [{ data: opening }, { data: announcements }, { data: deadlines }] = await Promise.all([
    supabase.from("settings").select("value").eq("key", "opening_ceremony").maybeSingle(),
    supabase.from("announcements").select("*").eq("status", "published").order("published_at", { ascending: false }).limit(6),
    supabase.from("deadlines").select("*").gte("due_at", new Date(Date.now() - 86400000).toISOString()).order("due_at").limit(5),
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
          <div className="row" style={{ marginBottom: "var(--space-2)" }}>
            <Badge tone="danger">{t("dashboard.urgent")}</Badge>
            {visBadge(a.visibility)}
            <span className="muted small">{formatDate(a.published_at, locale)}</span>
          </div>
          <strong>{pick(locale, a.title_en, a.title_tr)}</strong>
          <p style={{ margin: "var(--space-2) 0 0" }}>{pick(locale, a.body_en, a.body_tr)}</p>
        </div>
      ))}

      {ceremony && (
        <Card title={`${t("dashboard.countdownTo")} ${pick(locale, ceremony.label_en, ceremony.label_tr)}`}>
          <Countdown target={ceremony.at} />
          <p className="muted small" style={{ marginTop: "var(--space-3)", marginBottom: 0 }}>
            {formatDateTime(ceremony.at, locale)} (TRT, UTC+3)
          </p>
        </Card>
      )}

      <div className="grid grid-2">
        <Card title={t("dashboard.announcements")}>
          {normal.length === 0 ? (
            <EmptyState icon="megaphone">{t("dashboard.noAnnouncements")}</EmptyState>
          ) : (
            <ul className="list">
              {normal.map((a) => (
                <li key={a.id}>
                  <div className="row" style={{ marginBottom: 4 }}>
                    <span className="muted small">{formatDate(a.published_at, locale)}</span>
                    {visBadge(a.visibility)}
                  </div>
                  <strong>{pick(locale, a.title_en, a.title_tr)}</strong>
                  <p className="small" style={{ margin: "4px 0 0" }}>{pick(locale, a.body_en, a.body_tr)}</p>
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
                    <li key={d.id} className="row-between">
                      <div>
                        <div>{pick(locale, d.title_en, d.title_tr)} {visBadge(d.visibility)}</div>
                        <div className="muted small">{formatDateTime(d.due_at, locale)}</div>
                      </div>
                      <Badge tone={days <= 14 ? "warning" : "primary"}>{days >= 0 ? t("dashboard.daysLeft", { n: days }) : t("dashboard.overdue")}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
          <Card title={t("dashboard.whatsNew")}>
            <p className="small muted">
              {profile.previous_login_at ? t("dashboard.lastVisit", { date: formatDateTime(profile.previous_login_at, locale) }) : t("dashboard.firstVisit")}
            </p>
            <p className="small" style={{ margin: 0 }}>{t("dashboard.whatsNewSoon")}</p>
          </Card>
        </div>
      </div>

      <section>
        <h2>{t("dashboard.shortcuts")}</h2>
        <div className="grid grid-3">
          {ALL_NAV.filter((n) => n.href !== "/").map((n) => (
            <Link key={n.href} href={n.href} className="card card-link">
              <div className="shortcut">
                <span className="shortcut-icon"><Icon name={n.icon} /></span>
                <div>
                  <strong>{t(`nav.${n.key}`)}</strong>
                  <div className="muted small">{t(`sectionInfo.${n.key}`)}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <p className="muted small">{t("common.exampleNote")}</p>
    </div>
  );
}
