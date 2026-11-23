import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { tx, cols } from "@/lib/i18n";
import { isPreview } from "@/lib/preview";
import { getProfile, isStaff } from "@/lib/auth";
import { FavoriteButton } from "@/components/FavoriteButton";
import { withDraft, withHeadingAnchors } from "@/lib/content/render";
import { freshness, signPaths } from "@/lib/media";
import { dateRange, loadPlans } from "@/lib/venues";
import { Badge, Card, EmptyState, Icon } from "@/components/ui";
import { RichText } from "@/components/content/RichText";
import { PreviewBanner } from "@/components/content/PreviewBanner";
import { PlanCard } from "@/components/venues/PlanCard";
import { fmtBytes } from "@/lib/bytes";

export default async function VenuePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { slug } = await params;
  const preview = await isPreview(await searchParams);
  const { t, locale } = await getT();
  const supabase = await createClient();
  const { data } = await supabase.from("venues").select("*").eq("slug", slug).maybeSingle();
  if (!data || (!preview && data.status !== "published")) notFound();
  const v = withDraft(data, preview);
  let vsq = supabase.from("venue_sports").select("*").eq("venue_id", v.id).order("start_date");
  if (!preview) vsq = vsq.eq("status", "published");
  const [{ data: cluster }, { data: vs }, { data: sports }, { data: files }, plans] = await Promise.all([
    supabase.from("clusters").select(`${cols("title")}` as "*").eq("id", v.cluster_id).maybeSingle(),
    vsq,
    supabase.from("sports").select(`id,${cols("title")}` as "*"),
    supabase.from("venue_files").select("*").eq("venue_id", v.id).order("position"),
    loadPlans(supabase, locale, preview),
  ]);
  const myPlans = plans.filter((p) => p.venue_id === v.id);
  const { data: cams } = myPlans.length
    ? await supabase.from("cameras").select("id,plan_id,number,type,level,is_special,x,y,angle").in("plan_id", myPlans.map((p) => p.id))
    : { data: [] };
  const photos = (files ?? []).filter((f) => f.kind === "photo");
  const docs = (files ?? []).filter((f) => f.kind === "document");
  const signed = await signPaths(supabase, "venues", photos.map((p) => p.file_path));
  const sportName = (id: string) => { const s = (sports ?? []).find((x) => x.id === id); return s ? tx(s, "title", locale) : ""; };
  const me = await getProfile();
  const staff = isStaff(me);
  const { data: favs } = await supabase.from("favorites").select("kind,target_id").eq("user_id", me!.id);
  const fav = (kind: string, id: string) => (favs ?? []).some((f) => f.kind === kind && f.target_id === id);
  const sections = [
    { key: "commentary", icon: "users", html: tx(v, "commentary", locale) },
    { key: "unilaterals", icon: "camera", html: tx(v, "unilaterals", locale) },
    { key: "access", icon: "pin", html: tx(v, "access", locale) },
    { key: "contacts", icon: "mail", html: tx(v, "contacts", locale) },
  ].filter((s) => s.html);

  return (
    <article className="stack">
      {preview && <PreviewBanner exitHref={`/venues/${slug}`} />}
      <Link href="/venues" className="small">← {t("nav.venues")}</Link>
      <header className="row-between">
        <div>
          <div className="row small muted" style={{ marginBottom: 4 }}>
            <Badge tone="primary">{cluster ? tx(cluster, "title", locale) : ""}</Badge>
            {v.production_level && <Badge>{t(`venues.levels.${v.production_level}`)}</Badge>}
          </div>
          <h1 style={{ marginBottom: 4 }}>{tx(v, "title", locale)}</h1>
          {v.address && <p className="muted" style={{ margin: 0 }}>{v.address}</p>}
        </div>
        <div className="row">
          <FavoriteButton kind="venue" id={v.id} initial={fav("venue", v.id)} />
          {staff && <Link className="btn btn-sm" href={`/admin/content/venue/${v.id}`}>{t("cms.edit")}</Link>}
        </div>
      </header>

      <div className="grid grid-2">
        <Card title={t("venues.sportsAndDates")}>
          {(vs ?? []).length === 0 ? <p className="muted small">—</p> : (
            <ul className="list">
              {(vs ?? []).map((x) => (
                <li key={x.id} className="row-between">
                  <span className="row" style={{ gap: 4 }}><FavoriteButton kind="sport" id={x.sport_id} initial={fav("sport", x.sport_id)} compact label={sportName(x.sport_id)} /><strong>{sportName(x.sport_id)}</strong></span>
                  <span className="muted small">{dateRange(x.start_date, x.end_date, locale)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title={t("venues.keyFacts")}>
          <dl className="specs" style={{ fontSize: "var(--text-sm)" }}>
            <dt>{t("cms.fields.productionLevel")}</dt><dd>{v.production_level ? t(`venues.levels.${v.production_level}`) : "—"}</dd>
            <dt>{t("cms.fields.capacity")}</dt><dd>{v.capacity ? new Intl.NumberFormat(locale).format(v.capacity) : "—"}</dd>
            <dt>{t("cms.fields.address")}</dt><dd>{v.address ?? "—"}</dd>
            <dt>{t("nav.cameraMaps")}</dt><dd>{myPlans.length}</dd>
          </dl>
        </Card>
      </div>

      {photos.length > 0 && (
        <section className="stack-sm">
          <h2>{t("venues.photos")}</h2>
          <div className="media-grid">
            {photos.map((p) => signed[p.file_path] && (
              <figure key={p.id} className="card" style={{ margin: 0, padding: "var(--space-2)" }}>
                <a href={signed[p.file_path]} target="_blank" rel="noreferrer" aria-label={`${t("common.openPhoto")}: ${tx(p, "title", locale) || tx(v, "title", locale)}`}><img src={signed[p.file_path]} alt={tx(p, "title", locale)} width={1280} height={720} loading="lazy" decoding="async" style={{ width: "100%", height: "auto", borderRadius: 8 }} /></a>
                {tx(p, "title", locale) && <figcaption className="small muted">{tx(p, "title", locale)}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-2">
        {sections.map((s) => (
          <Card key={s.key} title={<span className="row" style={{ gap: 8 }}><Icon name={s.icon} /> {t(`venues.sections.${s.key}`)}</span>}>
            <RichText html={withHeadingAnchors(s.html).html} />
          </Card>
        ))}
      </div>

      <Card title={t("venues.documents")}>
        {docs.length === 0 ? <p className="muted small" style={{ margin: 0 }}>{t("venues.noDocuments")}</p> : (
          <ul className="list">
            {docs.map((d) => (
              <li key={d.id} className="row-between">
                <span><Icon name="file" size={16} /> {tx(d, "title", locale) || d.file_name}</span>
                <a className="btn btn-sm" href={`/api/venue-files/${d.id}`}>{t("mediaHub.download")} {d.file_size ? `(${fmtBytes(d.file_size)})` : ""}</a>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <section className="stack-sm" id="camera-maps">
        <h2>{t("nav.cameraMaps")}</h2>
        {myPlans.length === 0 ? <Card><EmptyState icon="camera" action={{ label: t("common.viewCameraMaps"), href: "/camera-maps" }}>{t("cameraMaps.noneForVenue")}</EmptyState></Card> : (
          <div className="media-grid">
            {myPlans.map((p) => (
              <PlanCard key={p.id} plan={p} showVenue={false} preview={preview}
                cameras={(cams ?? []).filter((c) => c.plan_id === p.id).map((c) => ({ ...c, x: Number(c.x), y: Number(c.y), angle: c.angle == null ? null : Number(c.angle) }))}
                badge={p.draft ? null : freshness(p.published_at, p.content_updated_at)}
                labels={{ cameras: t("cameraMaps.cameras"), specials: t("cameraMaps.specials"), isNew: t("mediaHub.badgeNew"), isUpdated: t("mediaHub.badgeUpdated"), draft: t("cms.status.draft"), level: p.level ? t(`venues.levels.${p.level}`) : "" }} />
            ))}
          </div>
        )}
      </section>
    </article>
  );
}
