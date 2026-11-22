import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n";
import { isPreview } from "@/lib/preview";
import { freshness } from "@/lib/media";
import { loadPlans } from "@/lib/venues";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { CameraMapsOverview } from "@/components/venues/CameraMapsOverview";
import { PreviewBanner } from "@/components/content/PreviewBanner";

export const metadata = { title: "Camera maps" };

export default async function CameraMapsPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const preview = await isPreview(await searchParams);
  const { t, locale } = await getT();
  const supabase = await createClient();
  const plans = await loadPlans(supabase, locale, preview);
  const [{ data: cams }, { data: clusters }, { data: sports }] = await Promise.all([
    plans.length ? supabase.from("cameras").select("id,plan_id,number,type,level,is_special,x,y,angle").in("plan_id", plans.map((p) => p.id)) : Promise.resolve({ data: [] as never[] }),
    supabase.from("clusters").select("slug,title_en,title_tr").eq("status", "published").order("position"),
    supabase.from("sports").select("id,title_en,title_tr").eq("status", "published").order("position"),
  ]);
  const used = new Set(plans.map((p) => p.sport_id));
  return (
    <div className="stack">
      {preview && <PreviewBanner exitHref="/camera-maps" />}
      <PageHeader title={t("nav.cameraMaps")} subtitle={t("cameraMaps.subtitle")} />
      {plans.length === 0 ? (
        <Card><EmptyState icon="camera" action={{ label: t("common.contactHost"), href: "/contacts" }}>{t("cameraMaps.empty")}</EmptyState></Card>
      ) : (
        <CameraMapsOverview
          clusters={(clusters ?? []).map((c) => ({ slug: c.slug, title: pick(locale, c.title_en, c.title_tr) }))}
          sports={(sports ?? []).filter((s) => used.has(s.id)).map((s) => ({ id: s.id, title: pick(locale, s.title_en, s.title_tr) }))}
          plans={plans.map((p) => ({
            id: p.id, title: p.title, venueTitle: p.venueTitle, venueSlug: p.venueSlug, sportId: p.sport_id, sportTitle: p.sportTitle,
            cluster: p.cluster, clusterTitle: p.clusterTitle, level: p.level, shape: p.shape, total: p.total, specials: p.specials,
            draft: p.draft, badge: p.draft ? null : freshness(p.published_at, p.content_updated_at),
            cameras: (cams ?? []).filter((c) => c.plan_id === p.id).map((c) => ({ ...c, x: Number(c.x), y: Number(c.y), angle: c.angle == null ? null : Number(c.angle) })),
          }))}
        />
      )}
    </div>
  );
}
