import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n";
import { isPreview } from "@/lib/preview";
import { requireApproved, isStaff } from "@/lib/auth";
import { formatDuration, freshness, signPaths } from "@/lib/media";
import { withDraft, withHeadingAnchors } from "@/lib/content/render";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/ui";
import { MediaHub, type HubItem } from "@/components/media/MediaHub";
import { PreviewBanner } from "@/components/content/PreviewBanner";

export const metadata = { title: "Media Hub" };

export default async function MediaHubPage({ searchParams }: { searchParams: Promise<{ preview?: string; item?: string; terms?: string; category?: string }> }) {
  const sp = await searchParams;
  const me = await requireApproved();
  const preview = await isPreview(sp);
  const { t, locale } = await getT();
  const supabase = await createClient();
  let aq = supabase.from("media_assets").select("*").order("category").order("position").order("title_en");
  if (!preview) aq = aq.eq("status", "published");
  const [{ data: assets }, { data: versions }, { data: terms }, { data: legal }] = await Promise.all([
    aq,
    supabase.from("media_versions").select("*").eq("is_current", true),
    supabase.from("material_terms_acceptances").select("accepted_at").eq("user_id", me.id).maybeSingle(),
    supabase.from("legal_pages").select("title_en,title_tr,body_en,body_tr").eq("slug", "material").maybeSingle(),
  ]);
  const previews = await signPaths(supabase, "media-previews", (assets ?? []).map((a) => a.preview_path));
  const byAsset = new Map((versions ?? []).map((v) => [v.asset_id, v]));
  const items: HubItem[] = (assets ?? []).map((raw) => {
    const a = withDraft(raw, preview);
    const v = byAsset.get(a.id);
    return {
      id: a.id,
      category: a.category,
      subtype: a.subtype,
      title: pick(locale, a.title_en, a.title_tr),
      description: pick(locale, a.description_en, a.description_tr),
      previewUrl: a.preview_path ? previews[a.preview_path] ?? null : null,
      previewKind: a.preview_kind,
      draft: a.status !== "published",
      visibility: a.visibility,
      badge: a.status === "published" ? freshness(a.published_at, a.content_updated_at) : null,
      version: v ? {
        number: v.version_number, fileName: v.file_name, size: v.file_size, format: v.format, codec: v.codec, resolution: v.resolution,
        frameRate: v.frame_rate, duration: v.duration_seconds != null ? formatDuration(v.duration_seconds) : null, date: formatDate(v.created_at, locale),
      } : null,
    };
  });
  const termsHtml = legal ? withHeadingAnchors(pick(locale, legal.body_en, legal.body_tr)).html : "";
  return (
    <div className="stack">
      {preview && <PreviewBanner exitHref="/media-hub" />}
      <PageHeader title={t("mediaHub.title")} subtitle={t("mediaHub.subtitle")} />
      <MediaHub
        items={items}
        termsAccepted={Boolean(terms) || isStaff(me)}
        termsTitle={legal ? pick(locale, legal.title_en, legal.title_tr) : t("legal.material")}
        termsHtml={termsHtml}
        focusItem={sp.item ?? null}
        openTerms={sp.terms === "1"}
        initialCategory={sp.category ?? "all"}
      />
    </div>
  );
}
