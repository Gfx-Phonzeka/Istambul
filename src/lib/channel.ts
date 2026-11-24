// Integrated Channel: daily grid of the Host Broadcaster's 24/7 ready-to-air channel.
export const CHANNEL_KINDS = ["live", "delayed", "highlights", "summary", "feature", "ceremony", "continuity"] as const;
export type ChannelKind = (typeof CHANNEL_KINDS)[number];
/** Colour of each programme type (timeline, PDF). */
export const KIND_COLOR: Record<ChannelKind, string> = {
  live: "#2f9e74", ceremony: "#c7a43a", delayed: "#0b84b5", highlights: "#7b3f98", summary: "#e8541e", feature: "#5b6676", continuity: "#94a3b8",
};
export const HHMM = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

export interface ChannelSlot {
  id: string; day: string; start_time: string; end_time: string | null; kind: ChannelKind;
  sport_id: string | null; venue_id: string | null; status: "draft" | "published";
  [k: string]: unknown; // title_xx / notes_xx per language
}

/** "Wed 24 Jul" style label for a YYYY-MM-DD day. */
export function dayLabel(day: string, intl: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }) {
  return new Intl.DateTimeFormat(intl, { ...opts, timeZone: "UTC" }).format(new Date(day + "T00:00:00Z"));
}

/** Whether a slot is on air now (times in the Games' local time; an end before the start ends the next day). */
export function isOnAir(s: { day: string; start_time: string; end_time: string | null }, now: { day: string; time: string }) {
  if (!s.end_time) return false;
  const overnight = s.end_time <= s.start_time;
  if (now.day === s.day) return now.time >= s.start_time && (overnight || now.time < s.end_time);
  const next = new Date(s.day + "T00:00:00Z"); next.setUTCDate(next.getUTCDate() + 1);
  return overnight && now.day === next.toISOString().slice(0, 10) && now.time < s.end_time;
}

/** Current day and time in a time zone. */
export function nowIn(tz: string) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

/** Minutes since midnight of an HH:MM time. */
export const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
