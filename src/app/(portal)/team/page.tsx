import Link from "next/link";
import { requireTeam } from "@/lib/auth";
import { reportsAccess } from "@/lib/reports";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { tx, cols } from "@/lib/i18n";
import { excerpt } from "@/lib/content/render";
import { formatDate } from "@/lib/format";
import { Alert, Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";

export const metadata = { title: "Production team" };

export default async function TeamPage() {
  const me = await requireTeam();
  const { t, locale } = await getT();
  const supabase = await createClient();
  const [{ data: messages }, { data: venue }, { data: sport }] = await Promise.all([
    supabase.from("announcements").select(`id,${cols("title")},${cols("body")},priority,published_at` as "*")
      .eq("visibility", "production").eq("status", "published").order("published_at", { ascending: false }).limit(10),
    me.team_venue_id ? supabase.from("venues").select(`slug,${cols("title")}` as "*").eq("id", me.team_venue_id).maybeSingle() : Promise.resolve({ data: null }),
    me.team_sport_id ? supabase.from("sports").select(`${cols("title")}` as "*").eq("id", me.team_sport_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const links = [
    { href: "/team/guidelines", icon: "book", label: t("team.links.guidelines"), hint: t("team.links.guidelinesHint") },
    ...(reportsAccess(me).any ? [{ href: "/team/reports", icon: "file", label: t("reports.nav"), hint: t("reports.subtitle") }] : []),
    { href: "/team/requests", icon: "inbox", label: t("team.links.requests"), hint: t("team.links.requestsHint") },
    { href: "/camera-maps", icon: "camera", label: t("nav.cameraMaps"), hint: t("team.links.mapsHint") },
    { href: "/schedule", icon: "calendar", label: t("nav.schedule"), hint: t("team.links.scheduleHint") },
  ];
  return (
    <div className="stack">
      <PageHeader title={t("team.title")} subtitle={t("team.subtitle")} />
      <Alert tone="info">{t("team.confidential")}</Alert>
      <div className="grid grid-2">
        <Card title={t("team.messages")} actions={<Link href="/news" className="small">{t("team.allNews")}</Link>}>
          {(messages ?? []).length === 0 ? <EmptyState icon="megaphone">{t("team.noMessages")}</EmptyState> : (
            <ul className="stack-sm" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {(messages ?? []).map((m) => (
                <li key={m.id}>
                  <Link href={`/news/${m.id}`} className={`card card-link${m.priority === "urgent" ? " card-urgent" : ""}`}>
                    <div className="row" style={{ marginBottom: 4 }}>
                      {m.priority === "urgent" && <Badge tone="danger">{t("dashboard.urgent")}</Badge>}
                      <span className="muted small">{m.published_at ? formatDate(m.published_at, locale) : ""}</span>
                    </div>
                    <strong>{tx(m, "title", locale)}</strong>
                    <div className="muted small">{excerpt(tx(m, "body", locale) ?? "", 160)}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <div className="stack">
          <Card title={t("team.myDetails")}>
            <dl className="specs">
              <dt>{t("team.function")}</dt><dd>{me.team_function ?? "—"}</dd>
              <dt>{t("schedule.venue")}</dt><dd>{venue ? <Link href={`/venues/${venue.slug}`}>{tx(venue, "title", locale)}</Link> : "—"}</dd>
              <dt>{t("venues.sport")}</dt><dd>{sport ? tx(sport, "title", locale) : "—"}</dd>
            </dl>
            <p className="muted small" style={{ marginBottom: 0 }}>{t("team.detailsHelp")}</p>
          </Card>
          <Card title={t("team.tools")}>
            <ul className="stack-sm" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="row" style={{ gap: 12 }}>
                    <Icon name={l.icon} />
                    <span><strong>{l.label}</strong><br /><span className="muted small">{l.hint}</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
