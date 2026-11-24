import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { tx, cols, intlLocale, DEFAULT_LOCALE } from "@/lib/i18n";
import { EVENT } from "@/lib/event";
import { requireStaff } from "@/lib/auth";
import { nowIn, type ChannelSlot } from "@/lib/channel";
import { isDay } from "@/lib/reports";
import { PageHeader } from "@/components/ui";
import { ChannelEditor } from "@/components/channel/ChannelEditor";

export const metadata = { title: "Integrated Channel · grid" };

export default async function AdminChannelPage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  if (!EVENT.integratedChannel) notFound();
  await requireStaff();
  const sp = await searchParams;
  const { t, locale } = await getT();
  const supabase = await createClient();
  const [{ data: all }, { data: sports }, { data: venues }, { data: cal }] = await Promise.all([
    supabase.from("channel_slots").select("*").order("day").order("start_time"),
    supabase.from("sports").select(`id,${cols("title")},position` as "*").order("position"),
    supabase.from("venues").select(`id,${cols("title")}` as "*").order(`title_${DEFAULT_LOCALE}`),
    supabase.from("calendar_rows").select("days"),
  ]);
  const slots = (all ?? []) as ChannelSlot[];
  // Days to offer: every competition day of the calendar, plus any day that already has a grid.
  const calDays = (cal ?? []).flatMap((r) => Object.keys((r as { days: Record<string, string> }).days ?? {}));
  const days = [...new Set([...calDays, ...slots.map((s) => s.day)])].sort();
  const now = nowIn(EVENT.tz);
  const day = isDay(sp.day) ? sp.day : days.find((d) => d >= now.day) ?? days[0] ?? now.day;
  const summary = Object.fromEntries(days.map((d) => {
    const ds = slots.filter((s) => s.day === d);
    return [d, { count: ds.length, published: ds.filter((s) => s.status === "published").length }];
  }));
  return (
    <div className="stack">
      <PageHeader title={t("channel.admin.title")} subtitle={t("channel.admin.subtitle", { tz: EVENT.utcOffset })} />
      <ChannelEditor
        key={day}
        day={day}
        days={days.includes(day) ? days : [...days, day].sort()}
        summary={summary}
        slots={slots.filter((s) => s.day === day)}
        sports={(sports ?? []).map((s) => ({ id: s.id, title: tx(s, "title", locale) }))}
        venues={(venues ?? []).map((v) => ({ id: v.id, title: tx(v, "title", locale) }))}
        intl={intlLocale(locale)}
      />
    </div>
  );
}
