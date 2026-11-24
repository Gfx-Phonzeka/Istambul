import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { tx } from "@/lib/i18n";
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
                {a.visibility === "rhb" && <Badge tone="info">{t("dashboard.rhbOnly")}</Badge>}
                {a.visibility === "partners" && <Badge tone="info">{t("dashboard.partnersOnly")}</Badge>}
                {a.visibility === "production" && <Badge tone="success">{t("dashboard.productionOnly")}</Badge>}
                {a.visibility === "internal" && <Badge tone="warning">{t("dashboard.internalOnly")}</Badge>}
                {a.status !== "published" && <Badge tone="warning">{t("cms.status.draft")}</Badge>}
                <span className="muted small">{formatDate(a.published_at ?? a.created_at, locale)}</span>
              </div>
              <strong>{tx(a, "title", locale)}</strong>
              <p className="small muted" style={{ margin: "4px 0 0" }}>{excerpt(tx(a, "body", locale))}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
