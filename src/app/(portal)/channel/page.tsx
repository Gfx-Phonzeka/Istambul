import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { tx, cols, intlLocale, DEFAULT_LOCALE } from "@/lib/i18n";
import { EVENT } from "@/lib/event";
import { getProfile, isStaff, requireApproved } from "@/lib/auth";
import { dayLabel, isOnAir, nowIn, type ChannelSlot } from "@/lib/channel";
import { isDay } from "@/lib/reports";
import { Badge, Card, EmptyState, PageHeader, Tabs } from "@/components/ui";
import { ChannelTimeline } from "@/components/channel/ChannelTimeline";
import { CHANNEL_KINDS } from "@/lib/channel";

export const metadata = { title: "Integrated Channel" };

const KIND_TONE: Record<string, "success" | "info" | "warning" | "neutral"> = { live: "success", ceremony: "success", delayed: "info", highlights: "info", summary: "warning", feature: "neutral", continuity: "neutral" };

export default async function ChannelPage({ searchParams }: { searchParams: Promise<{ day?: string; view?: string }> }) {
  if (!EVENT.integratedChannel) notFound();
  await requireApproved();
  const sp = await searchParams;
  const { t, locale } = await getT();
  const intl = intlLocale(locale);
  const supabase = await createClient();
  const [{ data }, { data: sports }, { data: venues }] = await Promise.all([
    supabase.from("channel_slots").select("*").eq("status", "published").order("day").order("start_time"),
    supabase.from("sports").select(`id,${cols("title")}` as "*"),
    supabase.from("venues").select(`id,slug,${cols("title")}` as "*").order(`title_${DEFAULT_LOCALE}`),
  ]);
  const slots = (data ?? []) as ChannelSlot[];
  const S = new Map((sports ?? []).map((s) => [s.id, tx(s, "title", locale)]));
  const V = new Map((venues ?? []).map((v) => [v.id, { title: tx(v, "title", locale), slug: v.slug as string }]));
  const days = [...new Set(slots.map((s) => s.day))];
  const now = nowIn(EVENT.tz);
  const day = isDay(sp.day) && days.includes(sp.day) ? sp.day : days.find((d) => d >= now.day) ?? days[0];
  const list = slots.filter((s) => s.day === day);
  const staff = isStaff(await getProfile());
  const view = sp.view === "timeline" ? "timeline" : "list";
  const q = (v: string) => `/channel?view=${v}${day ? `&day=${day}` : ""}`;
  return (
    <div className="stack">
      <PageHeader
        title={t("channel.title")}
        subtitle={t("channel.subtitle", { tz: EVENT.utcOffset })}
        actions={
          <>
            {days.length > 0 && <a className="btn" href={`/api/channel/pdf?lang=${locale}${day ? `&day=${day}` : ""}`}>{t("channel.pdfDay")}</a>}
            {days.length > 1 && <a className="btn" href={`/api/channel/pdf?lang=${locale}`}>{t("channel.pdfAll")}</a>}
            {staff && <Link className="btn" href={`/admin/channel${day ? `?day=${day}` : ""}`}>{t("channel.admin.edit")}</Link>}
          </>
        }
      />
      <div className="grid grid-2">
        {(["readyToAir", "summary"] as const).map((k) => (
          <div key={k} className="card stack-sm">
            <strong>{t(`channel.facts.${k}.title`)}</strong>
            <span className="small muted">{t(`channel.facts.${k}.text`)}</span>
          </div>
        ))}
      </div>
      {days.length === 0 ? (
        <Card><EmptyState icon="play">{t("channel.empty")}</EmptyState></Card>
      ) : (
        <>
          <Tabs items={[{ href: q("list"), label: t("channel.viewList"), active: view === "list" }, { href: q("timeline"), label: t("channel.viewTimeline"), active: view === "timeline" }]} />
          {view === "timeline" ? (
            <section className="card stack-sm" aria-label={t("channel.viewTimeline")}>
              <ChannelTimeline
                items={slots.map((s) => ({ id: s.id, day: s.day, start: s.start_time, end: s.end_time, kind: s.kind, title: tx(s, "title", locale) || (s.sport_id ? S.get(s.sport_id) ?? "" : ""), detail: [s.sport_id && tx(s, "title", locale) ? S.get(s.sport_id) : "", s.venue_id ? V.get(s.venue_id)?.title : ""].filter(Boolean).join(" · ") }))}
                days={days}
                current={day}
                intl={intl}
                nowMark={now}
                kindLabel={Object.fromEntries(CHANNEL_KINDS.map((k) => [k, t(`channel.kinds.${k}`)]))}
              />
              <p className="small muted" style={{ margin: 0 }}>{t("channel.note", { tz: EVENT.utcOffset })}</p>
            </section>
          ) : (<>
          <nav className="chip-row" aria-label={t("channel.days")}>
            {days.map((d) => (
              <Link key={d} prefetch={false} href={`/channel?view=list&day=${d}`} className={`chip${d === day ? " is-active" : ""}`} aria-current={d === day ? "page" : undefined}>
                {dayLabel(d, intl)}{d === now.day ? ` · ${t("channel.today")}` : ""}
              </Link>
            ))}
          </nav>
          <section className="card stack-sm" aria-labelledby="grid-title">
            <h2 id="grid-title" style={{ margin: 0 }}>{dayLabel(day, intl, { weekday: "long", day: "numeric", month: "long" })}</h2>
            <div className="table-wrap">
              <table className="table channel-grid">
                <thead><tr><th scope="col">{t("channel.time")}</th><th scope="col">{t("channel.programme")}</th><th scope="col">{t("channel.type")}</th></tr></thead>
                <tbody>
                  {list.map((s) => {
                    const onAir = isOnAir(s, now);
                    const title = tx(s, "title", locale) || (s.sport_id ? S.get(s.sport_id) : "") || "—";
                    const venue = s.venue_id ? V.get(s.venue_id) : null;
                    const notes = tx(s, "notes", locale);
                    return (
                      <tr key={s.id} className={onAir ? "is-onair" : undefined}>
                        <td className="sched-time">{s.start_time}{s.end_time ? `–${s.end_time}` : ""}{onAir && <div><Badge tone="danger">{t("channel.onAir")}</Badge></div>}</td>
                        <td>
                          <strong>{title}</strong>
                          {(s.sport_id && tx(s, "title", locale)) || venue ? (
                            <div className="small muted">
                              {[tx(s, "title", locale) && s.sport_id ? S.get(s.sport_id) : null].filter(Boolean).join("")}
                              {venue && <>{tx(s, "title", locale) && s.sport_id ? " · " : ""}<Link prefetch={false} href={`/venues/${venue.slug}`}>{venue.title}</Link></>}
                            </div>
                          ) : null}
                          {notes && <div className="small" style={{ whiteSpace: "pre-wrap" }}>{notes}</div>}
                        </td>
                        <td><Badge tone={KIND_TONE[s.kind] ?? "neutral"}>{t(`channel.kinds.${s.kind}`)}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="small muted" style={{ margin: 0 }}>{t("channel.note", { tz: EVENT.utcOffset })}</p>
          </section>
          </>)}
        </>
      )}
    </div>
  );
}
