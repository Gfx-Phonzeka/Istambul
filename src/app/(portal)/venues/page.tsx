import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n";
import { isPreview } from "@/lib/preview";
import { withDraft } from "@/lib/content/render";
import { signPaths } from "@/lib/media";
import { dateRange } from "@/lib/venues";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { VenuesExplorer, type VenueCard } from "@/components/venues/VenuesExplorer";
import { PreviewBanner } from "@/components/content/PreviewBanner";

export const metadata = { title: "Venues" };

export default async function VenuesPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const preview = await isPreview(await searchParams);
  const { t, locale } = await getT();
  const supabase = await createClient();
  let vq = supabase.from("venues").select("*").order("position").order("title_en");
  let vsq = supabase.from("venue_sports").select("*").order("start_date");
  if (!preview) { vq = vq.eq("status", "published"); vsq = vsq.eq("status", "published"); }
  const [{ data: venues }, { data: clusters }, { data: sports }, { data: vs }, { data: photos }, { data: plans }] = await Promise.all([
    vq,
    supabase.from("clusters").select("*").eq("status", "published").order("position"),
    supabase.from("sports").select("*").eq("status", "published").order("position"),
    vsq,
    supabase.from("venue_files").select("venue_id,file_path,position").eq("kind", "photo").order("position"),
    supabase.from("camera_plans").select("id,venue_id").eq("status", "published"),
  ]);
  const firstPhoto = new Map<string, string>();
  (photos ?? []).forEach((p) => { if (!firstPhoto.has(p.venue_id)) firstPhoto.set(p.venue_id, p.file_path); });
  const signed = await signPaths(supabase, "venues", [...firstPhoto.values()]);
  const clusterList = (clusters ?? []).map((c) => ({ id: c.id, slug: c.slug, title: pick(locale, c.title_en, c.title_tr) }));
  const sportMap = new Map((sports ?? []).map((s) => [s.id, pick(locale, s.title_en, s.title_tr)]));
  const ordered = (venues ?? []).map((v) => withDraft(v, preview))
    .sort((a, b) => clusterList.findIndex((c) => c.id === a.cluster_id) - clusterList.findIndex((c) => c.id === b.cluster_id));
  const cards: VenueCard[] = ordered.map((v, i) => {
    const cl = clusterList.find((c) => c.id === v.cluster_id);
    return {
      id: v.id, slug: v.slug, title: pick(locale, v.title_en, v.title_tr), cluster: cl?.slug ?? "", clusterTitle: cl?.title ?? "",
      x: Number(v.map_x), y: Number(v.map_y), n: i + 1, address: v.address, level: v.production_level, capacity: v.capacity,
      photo: firstPhoto.has(v.id) ? signed[firstPhoto.get(v.id)!] ?? null : null,
      sports: (vs ?? []).filter((x) => x.venue_id === v.id && sportMap.has(x.sport_id))
        .map((x) => ({ id: x.sport_id, title: sportMap.get(x.sport_id)!, dates: dateRange(x.start_date, x.end_date, locale) })),
      plans: (plans ?? []).filter((p) => p.venue_id === v.id).length,
      draft: v.status !== "published",
    };
  });
  return (
    <div className="stack">
      {preview && <PreviewBanner exitHref="/venues" />}
      <PageHeader title={t("nav.venues")} subtitle={t("venues.subtitle")} />
      {cards.length === 0 ? (
        <Card><EmptyState icon="pin">{t("venues.empty")}</EmptyState></Card>
      ) : (
        <VenuesExplorer venues={cards} clusters={clusterList.map(({ slug, title }) => ({ slug, title }))}
          sports={(sports ?? []).map((s) => ({ id: s.id, title: pick(locale, s.title_en, s.title_tr) }))} />
      )}
      <p className="muted small">{t("common.exampleNote")}</p>
    </div>
  );
}
