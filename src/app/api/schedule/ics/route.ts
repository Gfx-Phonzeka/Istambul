import { NextResponse, type NextRequest } from "next/server";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { normalizeLocale, pick } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const utc = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
/** RFC 5545 lines are folded at 75 octets. */
function fold(line: string) {
  const out: string[] = [];
  let cur = "";
  for (const ch of line) {
    if (Buffer.byteLength(cur + ch) > 73) { out.push(cur); cur = " " + ch; } else cur += ch;
  }
  out.push(cur);
  return out.join("\r\n");
}

// Calendar file (.ics) of the whole schedule or one sport, in the user's language.
export async function GET(req: NextRequest) {
  const me = await getProfile();
  if (!me || me.status !== "approved") return new NextResponse("Forbidden", { status: 403 });
  const locale = normalizeLocale(req.nextUrl.searchParams.get("lang"));
  const sport = req.nextUrl.searchParams.get("sport");
  const supabase = await createClient();
  let q = supabase.from("schedule_sessions").select("*").eq("status", "published").order("start_at");
  if (sport && /^[0-9a-f-]{36}$/.test(sport)) q = q.eq("sport_id", sport);
  const [{ data: sessions }, { data: sports }, { data: venues }] = await Promise.all([
    q, supabase.from("sports").select("id,slug,title_en,title_tr"), supabase.from("venues").select("id,title_en,title_tr,address"),
  ]);
  const S = new Map((sports ?? []).map((s) => [s.id, s]));
  const V = new Map((venues ?? []).map((v) => [v.id, v]));
  const now = utc(new Date().toISOString());
  const calName = sport && S.get(sport) ? `Istanbul 2027 – ${pick(locale, S.get(sport)!.title_en, S.get(sport)!.title_tr)}` : "Istanbul 2027";
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Medialuso//Istanbul 2027 HB Portal//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(calName)}`, "X-WR-TIMEZONE:Europe/Istanbul",
  ];
  for (const s of sessions ?? []) {
    const sp = S.get(s.sport_id), v = V.get(s.venue_id);
    const sportName = sp ? pick(locale, sp.title_en, sp.title_tr) : "";
    const phase = pick(locale, s.phase_en, s.phase_tr);
    const desc = [
      pick(locale, s.discipline_en, s.discipline_tr),
      s.is_medal ? `🥇 ${pick(locale, s.medal_events_en, s.medal_events_tr) || (locale === "tr" ? "Madalya" : "Medal")}` : "",
      s.is_oq ? (locale === "tr" ? "LA28 olimpiyat elemesi (OQ)" : "LA28 Olympic qualification (OQ)") : "",
      pick(locale, s.notes_en, s.notes_tr),
      `Code: ${s.code}`,
    ].filter(Boolean).join("\n");
    lines.push(
      "BEGIN:VEVENT", `UID:${s.id}@istanbul2027-rhb-portal`, `DTSTAMP:${now}`, `LAST-MODIFIED:${utc(s.updated_at)}`,
      `DTSTART:${utc(s.start_at)}`, `DTEND:${utc(s.end_at)}`,
      `SUMMARY:${esc(`${s.is_medal ? "🥇 " : ""}${sportName} – ${phase}`)}`,
      `LOCATION:${esc(v ? `${pick(locale, v.title_en, v.title_tr)}${v.address ? ", " + v.address : ""}` : "")}`,
      `DESCRIPTION:${esc(desc)}`, "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  const file = `istanbul2027-schedule${sport && S.get(sport) ? "-" + S.get(sport)!.slug : ""}-${locale}.ics`;
  return new NextResponse(lines.map(fold).join("\r\n") + "\r\n", {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="${file}"`, "Cache-Control": "private, no-store" },
  });
}
