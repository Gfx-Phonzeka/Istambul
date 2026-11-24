import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { tx, type Locale } from "@/lib/i18n";
import { formatDuration, signPaths } from "@/lib/media";
import { Badge, Card } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";

/** Latest briefing videos (production-team videos first), for the team's home page and Team area. */
export async function BriefingsHighlight({ supabase, userId, locale, t, limit = 4 }: {
  supabase: SupabaseClient; userId: string; locale: Locale; t: (k: string, v?: Record<string, string | number>) => string; limit?: number;
}) {
  const [{ data }, { data: views }] = await Promise.all([
    supabase.from("briefing_videos").select("*").eq("status", "published").order("published_at", { ascending: false }).limit(30),
    supabase.from("briefing_views").select("video_id").eq("user_id", userId),
  ]);
  const watched = new Set((views ?? []).map((v) => v.video_id));
  const videos = (data ?? [])
    .sort((a, b) => Number(b.visibility === "production") - Number(a.visibility === "production") || Number(watched.has(a.id)) - Number(watched.has(b.id)))
    .slice(0, limit);
  if (videos.length === 0) return null;
  const posters = await signPaths(supabase, "briefings", videos.map((v) => v.poster_path));
  return (
    <Card title={<span className="row" style={{ gap: 8 }}><Icon name="play" /> {t("nav.briefings")}</span>} actions={<Link href="/briefings" className="small">{t("briefings.seeAll")}</Link>}>
      <div className="media-grid">
        {videos.map((v) => (
          <Link key={v.id} href={`/briefings/${v.id}`} className="card card-link media-card">
            <div className="media-preview">
              {v.poster_path && posters[v.poster_path] ? <img src={posters[v.poster_path]} alt="" width={640} height={360} loading="lazy" decoding="async" /> : <Icon name="play" size={40} />}
              <span className="play-icon"><Icon name="play" size={28} /></span>
              {v.duration_seconds ? <span className="duration">{formatDuration(v.duration_seconds)}</span> : null}
              <div className="media-badges">
                {v.visibility === "production" && <Badge tone="success">{t("dashboard.productionOnly")}</Badge>}
                {watched.has(v.id) ? <Badge tone="success">✓ {t("briefings.watched")}</Badge> : <Badge tone="warning">{t("briefings.notWatched")}</Badge>}
              </div>
            </div>
            <strong>{tx(v, "title", locale)}</strong>
          </Link>
        ))}
      </div>
    </Card>
  );
}
