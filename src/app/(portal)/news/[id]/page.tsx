import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { tx } from "@/lib/i18n";
import { withDraft, withHeadingAnchors } from "@/lib/content/render";
import { formatDateTime } from "@/lib/format";
import { isPreview } from "@/lib/preview";
import { getProfile, isStaff } from "@/lib/auth";
import { Badge } from "@/components/ui";
import { RichText } from "@/components/content/RichText";
import { PreviewBanner } from "@/components/content/PreviewBanner";

export default async function NewsItem({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const preview = await isPreview(await searchParams);
  const { t, locale } = await getT();
  const supabase = await createClient();
  const { data } = await supabase.from("announcements").select("*").eq("id", id).maybeSingle();
  if (!data || (!preview && data.status !== "published")) notFound();
  const a = withDraft(data, preview);
  const { html } = withHeadingAnchors(tx(a, "body", locale));
  const staff = isStaff(await getProfile());
  return (
    <article className="stack" style={{ maxWidth: 820 }}>
      {preview && <PreviewBanner exitHref={`/news/${id}`} />}
      <Link href="/news" className="small">← {t("news.back")}</Link>
      <header className="row-between">
        <div>
          <div className="row" style={{ marginBottom: 6 }}>
            {a.priority === "urgent" && <Badge tone="danger">{t("dashboard.urgent")}</Badge>}
            {a.visibility === "rhb" && <Badge tone="info">{t("dashboard.rhbOnly")}</Badge>}
            {a.visibility === "partners" && <Badge tone="info">{t("dashboard.partnersOnly")}</Badge>}
            <span className="muted small">{formatDateTime(a.published_at ?? a.created_at, locale)}</span>
          </div>
          <h1>{tx(a, "title", locale)}</h1>
        </div>
        {staff && <Link className="btn btn-sm" href={`/admin/content/announcement/${a.id}`}>{t("cms.edit")}</Link>}
      </header>
      <div className="card"><RichText html={html} /></div>
    </article>
  );
}
