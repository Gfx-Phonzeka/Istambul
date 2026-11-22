import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n";
import { isPreview } from "@/lib/preview";
import { getProfile, isStaff } from "@/lib/auth";
import { freshness, signPaths } from "@/lib/media";
import { formatDate } from "@/lib/format";
import { loadPlans } from "@/lib/venues";
import { Badge } from "@/components/ui";
import { PlanViewer } from "@/components/venues/PlanViewer";
import { PreviewBanner } from "@/components/content/PreviewBanner";

export default async function CameraPlanPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const preview = await isPreview(await searchParams);
  const { t, locale } = await getT();
  const supabase = await createClient();
  const plans = await loadPlans(supabase, locale, preview);
  const plan = plans.find((p) => p.id === id);
  if (!plan) notFound();
  const [{ data: cams }, { data: drawing }] = await Promise.all([
    supabase.from("cameras").select("*").eq("plan_id", id).order("position"),
    supabase.from("camera_drawings").select("*").eq("plan_id", id).eq("is_current", true).maybeSingle(),
  ]);
  const signed = drawing ? await signPaths(supabase, "camera-drawings", [drawing.file_path], 3600) : {};
  await supabase.rpc("log_event", { p_action: "view.camera_map", p_entity_type: "camera_plans", p_entity_id: id });
  const staff = isStaff(await getProfile());
  const badge = plan.draft ? null : freshness(plan.published_at, plan.content_updated_at);
  return (
    <div className="stack">
      {preview && <PreviewBanner exitHref={`/camera-maps/${id}`} />}
      <div className="small"><Link href="/camera-maps">{t("nav.cameraMaps")}</Link> › <Link href={`/venues/${plan.venueSlug}`}>{plan.venueTitle}</Link></div>
      <header className="row-between">
        <div>
          <div className="row small" style={{ marginBottom: 4 }}>
            <Badge tone="primary">{plan.clusterTitle}</Badge>
            {plan.level && <Badge>{t(`venues.levels.${plan.level}`)}</Badge>}
            {badge === "new" && <Badge tone="success">{t("mediaHub.badgeNew")}</Badge>}
            {badge === "updated" && <Badge tone="info">{t("mediaHub.badgeUpdated")}</Badge>}
          </div>
          <h1 style={{ marginBottom: 4 }}>{plan.venueTitle} · {plan.sportTitle}</h1>
          <p className="muted" style={{ margin: 0 }}>{plan.title}</p>
        </div>
        <div className="row">
          <a className="btn btn-primary" href={`/api/camera-plans/${id}/export?lang=${locale}`}>{t("cameraMaps.exportPdf")}</a>
          {staff && <Link className="btn" href={`/admin/content/camera_plan/${id}`}>{t("cms.edit")}</Link>}
        </div>
      </header>
      <PlanViewer
        shape={plan.shape}
        title={`${plan.venueTitle} · ${plan.sportTitle}`}
        cameras={(cams ?? []).map((c) => ({
          id: c.id, number: c.number, type: c.type, level: c.level, is_special: c.is_special, x: Number(c.x), y: Number(c.y),
          angle: c.angle == null ? null : Number(c.angle), lens: c.lens, function: pick(locale, c.function_en, c.function_tr),
        }))}
        drawing={drawing && signed[drawing.file_path] ? {
          url: signed[drawing.file_path], downloadUrl: `/api/camera-plans/${id}/drawing`, version: drawing.version_number,
          date: formatDate(drawing.created_at, locale),
        } : null}
      />
    </div>
  );
}
