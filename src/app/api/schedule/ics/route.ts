import { EVENT } from "@/lib/event";
import { NextResponse, type NextRequest } from "next/server";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { normalizeLocale, tx, cols } from "@/lib/i18n";

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
    q, supabase.from("sports").select(`id,slug,${cols("title")}` as "*"), supabase.from("venues").select(`id,${cols("title")},address` as "*"),
  ]);
  const S = new Map((sports ?? []).map((s) => [s.id, s]));
  const V = new Map((venues ?? []).map((v) => [v.id, v]));
  const now = utc(new Date().toISOString());
  const calName = sport && S.get(sport) ? `${EVENT.name} – ${tx(S.get(sport)!, "title", locale)}` : EVENT.name;
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Medialuso//${EVENT.name} HB Portal//EN`, "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(calName)}`, `X-WR-TIMEZONE:${EVENT.tz}`,
  ];
  for (const s of sessions ?? []) {
    const sp = S.get(s.sport_id), v = V.get(s.venue_id);
    const sportName = sp ? tx(sp, "title", locale) : "";
    const phase = tx(s, "phase", locale);
    const desc = [
      tx(s, "discipline", locale),
      s.is_medal ? `🥇 ${tx(s, "medal_events", locale) || (locale === "tr" ? "Madalya" : "Medal")}` : "",
      s.is_oq ? (locale === "tr" ? "LA28 olimpiyat elemesi (OQ)" : "LA28 Olympic qualification (OQ)") : "",
      tx(s, "notes", locale),
      `Code: ${s.code}`,
    ].filter(Boolean).join("\n");
    lines.push(
      "BEGIN:VEVENT", `UID:${s.id}@istanbul2027-rhb-portal`, `DTSTAMP:${now}`, `LAST-MODIFIED:${utc(s.updated_at)}`,
      `DTSTART:${utc(s.start_at)}`, `DTEND:${utc(s.end_at)}`,
      `SUMMARY:${esc(`${s.is_medal ? "🥇 " : ""}${sportName} – ${phase}`)}`,
      `LOCATION:${esc(v ? `${tx(v, "title", locale)}${v.address ? ", " + v.address : ""}` : "")}`,
      `DESCRIPTION:${esc(desc)}`, "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  const file = `${EVENT.slug}-schedule${sport && S.get(sport) ? "-" + S.get(sport)!.slug : ""}-${locale}.ics`;
  return new NextResponse(lines.map(fold).join("\r\n") + "\r\n", {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="${file}"`, "Cache-Control": "private, no-store" },
  });
}
