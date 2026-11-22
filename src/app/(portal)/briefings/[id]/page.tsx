import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n";
import { isPreview } from "@/lib/preview";
import { getProfile, isStaff, requireApproved } from "@/lib/auth";
import { formatDuration, signPaths } from "@/lib/media";
import { withDraft } from "@/lib/content/render";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui";
import { BriefingPlayer } from "@/components/media/BriefingPlayer";
import { PreviewBanner } from "@/components/content/PreviewBanner";

export default async function BriefingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const me = await requireApproved();
  const preview = await isPreview(await searchParams);
  const { t, locale } = await getT();
  const supabase = await createClient();
  const { data } = await supabase.from("briefing_videos").select("*").eq("id", id).maybeSingle();
  if (!data || (!preview && data.status !== "published")) notFound();
  const v = withDraft(data, preview);
  const [{ data: view }, signedVideo, signedPoster] = await Promise.all([
    supabase.from("briefing_views").select("video_id").eq("user_id", me.id).eq("video_id", id).maybeSingle(),
    signPaths(supabase, "briefings", [v.video_path], 4 * 3600),
    signPaths(supabase, "briefings", [v.poster_path]),
  ]);
  await supabase.rpc("log_event", { p_action: "view.briefing", p_entity_type: "briefing_videos", p_entity_id: id });
  const staff = isStaff(await getProfile());
  return (
    <article className="stack" style={{ maxWidth: 980 }}>
      {preview && <PreviewBanner exitHref={`/briefings/${id}`} />}
      <Link href="/briefings" className="small">← {t("nav.briefings")}</Link>
      <header className="row-between">
        <div>
          <div className="row small muted" style={{ marginBottom: 4 }}>
            <Badge tone="primary">{t(`briefings.categories.${v.category}`)}</Badge>
            <span>{formatDate(v.recorded_on ?? v.published_at, locale)}</span>
            {v.duration_seconds ? <span>· {formatDuration(v.duration_seconds)}</span> : null}
          </div>
          <h1>{pick(locale, v.title_en, v.title_tr)}</h1>
        </div>
        {staff && <Link className="btn btn-sm" href={`/admin/content/briefing_video/${id}`}>{t("cms.edit")}</Link>}
      </header>
      <BriefingPlayer
        id={id}
        src={v.video_path ? signedVideo[v.video_path] ?? null : null}
        mime={v.video_mime}
        poster={v.poster_path ? signedPoster[v.poster_path] ?? null : null}
        hasEn={Boolean(v.subtitles_en_path)}
        hasTr={Boolean(v.subtitles_tr_path)}
        watched={Boolean(view)}
      />
      {pick(locale, v.description_en, v.description_tr) && <p>{pick(locale, v.description_en, v.description_tr)}</p>}
    </article>
  );
}
