import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n";
import { isPreview } from "@/lib/preview";
import { withDraft, withHeadingAnchors } from "@/lib/content/render";
import { Badge, Card, EmptyState, Icon, PageHeader, Tabs } from "@/components/ui";
import { RichText } from "@/components/content/RichText";
import { FeedGrid, type FeedRow } from "@/components/schedule/FeedGrid";
import { PreviewBanner } from "@/components/content/PreviewBanner";

export const metadata = { title: "Broadcast & distribution" };
const TABS = ["feeds", "distribution", "technical", "additional"] as const;

export default async function BroadcastPage({ searchParams }: { searchParams: Promise<{ preview?: string; tab?: string }> }) {
  const sp = await searchParams;
  const preview = await isPreview(sp);
  const tab = (TABS as readonly string[]).includes(sp.tab ?? "") ? sp.tab! : "feeds";
  const { t, locale } = await getT();
  const supabase = await createClient();
  const pq = preview ? "&preview=1" : "";
  const pub = <T extends { eq: (c: string, v: string) => T }>(q: T) => (preview ? q : q.eq("status", "published"));

  let content: React.ReactNode = null;
  if (tab === "feeds") {
    const [{ data }, { data: venues }, { data: sports }] = await Promise.all([
      pub(supabase.from("broadcast_feeds").select("*").order("start_at")),
      supabase.from("venues").select("id,slug,title_en,title_tr"),
      supabase.from("sports").select("id,title_en,title_tr"),
    ]);
    const V = new Map((venues ?? []).map((v) => [v.id, v]));
    const S = new Map((sports ?? []).map((s) => [s.id, s]));
    const feeds: FeedRow[] = (data ?? []).map((raw) => {
      const f = withDraft(raw, preview);
      const v = f.venue_id ? V.get(f.venue_id) : null, s = f.sport_id ? S.get(f.sport_id) : null;
      return {
        id: f.id, code: f.code, type: f.feed_type, title: pick(locale, f.title_en, f.title_tr), venue: v ? pick(locale, v.title_en, v.title_tr) : "",
        venueSlug: v?.slug ?? null, sport: s ? pick(locale, s.title_en, s.title_tr) : "", start: f.start_at, end: f.end_at, channel: f.channel,
        notes: pick(locale, f.notes_en, f.notes_tr), draft: f.status !== "published",
      };
    });
    content = feeds.length ? <FeedGrid feeds={feeds} /> : <Card><EmptyState icon="broadcast" action={{ label: t("common.contactHost"), href: "/contacts" }}>{t("broadcast.noFeeds")}</EmptyState></Card>;
  } else if (tab === "distribution") {
    const { data } = await pub(supabase.from("distribution_channels").select("*").order("position"));
    const rows = (data ?? []).map((r) => withDraft(r, preview));
    content = (
      <div className="stack">
        <div className="alert alert-info">{t("broadcast.ebuNote")}</div>
        {rows.length === 0 ? <Card><EmptyState icon="broadcast" action={{ label: t("common.contactHost"), href: "/contacts" }}>—</EmptyState></Card> : (
          <div className="grid grid-3">
            {rows.map((c) => (
              <Card key={c.id} title={<span className="row" style={{ gap: 8 }}><Badge tone="primary">{t(`broadcast.channelKinds.${c.kind}`)}</Badge> {pick(locale, c.title_en, c.title_tr)}</span>}>
                <RichText html={withHeadingAnchors(pick(locale, c.body_en, c.body_tr)).html} />
                {pick(locale, c.contact_en, c.contact_tr) && (
                  <div className="small" style={{ marginTop: 12, borderTop: "1px solid var(--color-border)", paddingTop: 8 }}>
                    <strong>{t("broadcast.contact")}</strong>
                    <RichText html={pick(locale, c.contact_en, c.contact_tr)} />
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  } else if (tab === "technical") {
    const { data } = await pub(supabase.from("tech_parameters").select("*").order("grp").order("position"));
    const rows = (data ?? []).map((r) => withDraft(r, preview));
    const groups = ["video", "audio", "graphics", "timecode", "other"].filter((g) => rows.some((r) => r.grp === g));
    content = rows.length === 0 ? <Card><EmptyState icon="settings" action={{ label: t("common.contactHost"), href: "/contacts" }}>—</EmptyState></Card> : (
      <div className="grid grid-2">
        {groups.map((g) => (
          <Card key={g} title={t(`broadcast.paramGroups.${g}`)}>
            <dl className="specs" style={{ fontSize: "var(--text-sm)", gap: "6px 16px" }}>
              {rows.filter((r) => r.grp === g).map((r) => (
                <div key={r.id} style={{ display: "contents" }}><dt>{pick(locale, r.title_en, r.title_tr)}</dt><dd><strong>{pick(locale, r.value_en, r.value_tr)}</strong></dd></div>
              ))}
            </dl>
          </Card>
        ))}
      </div>
    );
  } else {
    const { data } = await pub(supabase.from("info_blocks").select("*").eq("slug", "additional-production")).maybeSingle();
    const b = data ? withDraft(data, preview) : null;
    content = (
      <Card title={b ? pick(locale, b.title_en, b.title_tr) : t("broadcast.tabs.additional")}>
        {b ? <RichText html={withHeadingAnchors(pick(locale, b.body_en, b.body_tr)).html} /> : <p className="muted">—</p>}
      </Card>
    );
  }

  return (
    <div className="stack">
      {preview && <PreviewBanner exitHref="/broadcast" />}
      <PageHeader title={t("nav.broadcast")} subtitle={t("broadcast.subtitle")} />
      <Tabs items={TABS.map((x) => ({ href: `/broadcast?tab=${x}${pq}`, label: t(`broadcast.tabs.${x}`), active: tab === x }))} />
      {content}
      <p className="muted small">{t("common.exampleNote")}</p>
    </div>
  );
}
