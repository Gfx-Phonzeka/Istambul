import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicFrame } from "@/components/shell/PublicFrame";
import { getT } from "@/lib/i18n/server";
import { tx } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { withDraft, withHeadingAnchors } from "@/lib/content/render";
import { isPreview } from "@/lib/preview";
import { RichText } from "@/components/content/RichText";

export default async function LegalPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { slug } = await params;
  const preview = await isPreview(await searchParams);
  const { t, locale } = await getT();
  const supabase = await createClient();
  const { data } = await supabase.from("legal_pages").select("*").eq("slug", slug).maybeSingle();
  if (!data || (!preview && data.status !== "published")) notFound();
  const doc = withDraft(data, preview);
  const { html } = withHeadingAnchors(tx(doc, "body", locale));
  return (
    <PublicFrame wide>
      <article className="stack">
        {preview && <div className="alert alert-warning">{t("cms.previewBanner")}</div>}
        <h1>{tx(doc, "title", locale)}</h1>
        <RichText html={html} />
        <Link href="/legal" className="small">← {t("nav.legal")}</Link>
      </article>
    </PublicFrame>
  );
}
