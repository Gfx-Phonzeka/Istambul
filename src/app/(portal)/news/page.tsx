import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n";
import { excerpt } from "@/lib/content/render";
import { formatDate } from "@/lib/format";
import { isPreview } from "@/lib/preview";
import { Badge, Card, EmptyState, PageHeader, Tabs } from "@/components/ui";

export const metadata = { title: "News & notices" };

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ filter?: string; preview?: string }> }) {
  const sp = await searchParams;
  const preview = await isPreview(sp);
  const { t, locale } = await getT();
  const supabase = await createClient();
  let q = supabase.from("announcements").select("*").order("published_at", { ascending: false, nullsFirst: true });
  if (!preview) q = q.eq("status", "published");
  if (sp.filter === "urgent") q = q.eq("priority", "urgent");
  const { data } = await q;
  const rows = data ?? [];
  return (
    <div className="stack">
      <PageHeader title={t("news.title")} subtitle={t("news.subtitle")} />
      <Tabs items={[
        { href: "/news", label: t("news.all"), active: sp.filter !== "urgent" },
        { href: "/news?filter=urgent", label: t("news.urgentOnly"), active: sp.filter === "urgent" },
      ]} />
      {rows.length === 0 ? (
        <Card><EmptyState icon="megaphone" action={{ label: t("common.contactHost"), href: "/contacts" }}>{t("news.empty")}</EmptyState></Card>
      ) : (
        <div className="stack-sm">
          {rows.map((a) => (
            <Link key={a.id} href={`/news/${a.id}${preview ? "?preview=1" : ""}`} className={`card card-link${a.priority === "urgent" ? " card-urgent" : ""}`}>
              <div className="row" style={{ marginBottom: 4 }}>
                {a.priority === "urgent" && <Badge tone="danger">{t("dashboard.urgent")}</Badge>}
                {a.visibility === "partners" && <Badge tone="info">{t("dashboard.partnersOnly")}</Badge>}
                {a.visibility === "internal" && <Badge tone="warning">{t("dashboard.internalOnly")}</Badge>}
                {a.status !== "published" && <Badge tone="warning">{t("cms.status.draft")}</Badge>}
                <span className="muted small">{formatDate(a.published_at ?? a.created_at, locale)}</span>
              </div>
              <strong>{pick(locale, a.title_en, a.title_tr)}</strong>
              <p className="small muted" style={{ margin: "4px 0 0" }}>{excerpt(pick(locale, a.body_en, a.body_tr))}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
