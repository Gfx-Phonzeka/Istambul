import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { tx, DEFAULT_LOCALE } from "@/lib/i18n";
import { isPreview } from "@/lib/preview";
import { requireApproved } from "@/lib/auth";
import { formatDuration, signPaths } from "@/lib/media";
import { withDraft } from "@/lib/content/render";
import { formatDate } from "@/lib/format";
import { BRIEFING_CATEGORIES } from "@/lib/content/registry";
import { Badge, Card, EmptyState, Icon, PageHeader } from "@/components/ui";
import { PreviewBanner } from "@/components/content/PreviewBanner";

export const metadata = { title: "Briefings" };

export default async function BriefingsPage({ searchParams }: { searchParams: Promise<{ preview?: string; category?: string }> }) {
  const sp = await searchParams;
  const me = await requireApproved();
  const preview = await isPreview(sp);
  const { t, locale } = await getT();
  const supabase = await createClient();
  let q = supabase.from("briefing_videos").select("*").order("position").order(`title_${DEFAULT_LOCALE}`);
  if (!preview) q = q.eq("status", "published");
  const [{ data }, { data: views }] = await Promise.all([q, supabase.from("briefing_views").select("video_id").eq("user_id", me.id)]);
  const videos = (data ?? []).map((v) => withDraft(v, preview));
  const watched = new Set((views ?? []).map((v) => v.video_id));
  const posters = await signPaths(supabase, "briefings", videos.map((v) => v.poster_path));
  const active = (BRIEFING_CATEGORIES as readonly string[]).includes(sp.category ?? "") ? sp.category! : "all";
  const cats = BRIEFING_CATEGORIES.filter((c) => videos.some((v) => v.category === c));
  const shown = cats.filter((c) => active === "all" || c === active);
  const q2 = preview ? "&preview=1" : "";
  const watchedCount = videos.filter((v) => watched.has(v.id)).length;

  return (
    <div className="stack">
      {preview && <PreviewBanner exitHref="/briefings" />}
      <PageHeader title={t("nav.briefings")} subtitle={t("briefings.subtitle")}
        actions={videos.length > 0 && <Badge tone="primary">{t("briefings.progress", { n: watchedCount, total: videos.length })}</Badge>} />
      {videos.length === 0 ? (
        <Card><EmptyState icon="play" action={{ label: t("common.contactHost"), href: "/contacts" }}>{t("briefings.empty")}</EmptyState></Card>
      ) : (
        <>
          <div className="chips">
            <Link href={`/briefings?category=all${q2}`} className={`chip${active === "all" ? " is-active" : ""}`}>{t("mediaHub.allCategories")}</Link>
            {cats.map((c) => (
              <Link key={c} href={`/briefings?category=${c}${q2}`} className={`chip${active === c ? " is-active" : ""}`}>{t(`briefings.categories.${c}`)}</Link>
            ))}
          </div>
          {shown.map((c) => (
            <section key={c} className="stack-sm">
              <h2>{t(`briefings.categories.${c}`)}</h2>
              <div className="media-grid">
                {videos.filter((v) => v.category === c).map((v) => (
                  <Link key={v.id} href={`/briefings/${v.id}${preview ? "?preview=1" : ""}`} className="card card-link media-card">
                    <div className="media-preview">
                      {v.poster_path && posters[v.poster_path] ? <img src={posters[v.poster_path]} alt="" width={640} height={360} loading="lazy" decoding="async" /> : <Icon name="play" size={40} />}
                      <span className="play-icon"><Icon name="play" size={28} /></span>
                      {v.duration_seconds ? <span className="duration">{formatDuration(v.duration_seconds)}</span> : null}
                      <div className="media-badges">
                        {watched.has(v.id) ? <Badge tone="success">✓ {t("briefings.watched")}</Badge> : <Badge>{t("briefings.notWatched")}</Badge>}
                        {v.status !== "published" && <Badge tone="warning">{t("cms.status.draft")}</Badge>}
                      </div>
                    </div>
                    <strong>{tx(v, "title", locale)}</strong>
                    <span className="muted small">{formatDate(v.recorded_on ?? v.published_at, locale)}</span>
                    {tx(v, "description", locale) && <p className="small muted" style={{ margin: 0 }}>{tx(v, "description", locale)}</p>}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
