import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";
import { EVENT } from "@/lib/event";
import { cols, LOCALES, tx, type Locale } from "@/lib/i18n";
import { CHANNEL_KINDS, HHMM, type ChannelKind, type ChannelSlot } from "@/lib/channel";

export const BRAND = EVENT.id === "lima" ? { primary: "#2d5196", accent: "#e8541e", ink: "#1d1f4a" } : { primary: "#0a6b70", accent: "#d7372a", ink: "#16202e" };
export { KIND_COLOR } from "@/lib/channel";

export interface ChannelRow { slot: ChannelSlot; title: string; sport: string; venue: string; notes: string }

/** Published (or, for staff previews, all) slots with display texts in one language. */
export async function loadChannel(supabase: SupabaseClient, locale: Locale, opts: { days?: string[]; drafts?: boolean } = {}) {
  let q = supabase.from("channel_slots").select("*").order("day").order("start_time");
  if (!opts.drafts) q = q.eq("status", "published");
  if (opts.days?.length) q = q.in("day", opts.days);
  const [{ data }, { data: sports }, { data: venues }] = await Promise.all([
    q,
    supabase.from("sports").select(`id,slug,${cols("title")}` as "*"),
    supabase.from("venues").select(`id,slug,${cols("title")}` as "*"),
  ]);
  const S = new Map((sports ?? []).map((s) => [s.id, s]));
  const V = new Map((venues ?? []).map((v) => [v.id, v]));
  return ((data ?? []) as ChannelSlot[]).map((s): ChannelRow => {
    const sp = s.sport_id ? S.get(s.sport_id) : null, ve = s.venue_id ? V.get(s.venue_id) : null;
    return { slot: s, title: tx(s, "title", locale) || (sp ? tx(sp, "title", locale) : ""), sport: sp ? tx(sp, "title", locale) : "", venue: ve ? tx(ve, "title", locale) : "", notes: tx(s, "notes", locale) };
  });
}

// ---------- Excel template and import ----------
const COLS = [
  { key: "date", header: "Date (YYYY-MM-DD) *", width: 14 },
  { key: "start", header: `Start (HH:MM, ${EVENT.name.replace(/ \d+$/, "")}) *`, width: 12 },
  { key: "end", header: "End (HH:MM)", width: 10 },
  { key: "kind", header: `Type * (${CHANNEL_KINDS.join(" / ")})`, width: 22 },
  { key: "sport", header: "Sport (code)", width: 20 },
  { key: "venue", header: "Venue (code)", width: 22 },
  ...LOCALES.map((l) => ({ key: `title_${l}`, header: `Title ${l.toUpperCase()}`, width: 30 })),
  ...LOCALES.map((l) => ({ key: `notes_${l}`, header: `Notes ${l.toUpperCase()}`, width: 30 })),
];

export async function buildChannelTemplate(supabase: SupabaseClient): Promise<ArrayBuffer> {
  const main = LOCALES[0];
  const [{ data: slots }, { data: sports }, { data: venues }] = await Promise.all([
    supabase.from("channel_slots").select("*").order("day").order("start_time"),
    supabase.from("sports").select(`id,slug,title_${main}` as "*").order("position"),
    supabase.from("venues").select(`id,slug,title_${main}` as "*").order(`title_${main}`),
  ]);
  const S = new Map((sports ?? []).map((s) => [s.id, s.slug])), V = new Map((venues ?? []).map((v) => [v.id, v.slug]));
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Grid");
  ws.columns = COLS.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + BRAND.primary.slice(1) } };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  for (const s of (slots ?? []) as ChannelSlot[]) {
    ws.addRow({ ...s, date: s.day, start: s.start_time, end: s.end_time ?? "", kind: s.kind, sport: s.sport_id ? S.get(s.sport_id) : "", venue: s.venue_id ? V.get(s.venue_id) : "" });
  }
  if (!slots?.length) ws.addRow({ date: "2027-07-24", start: "16:00", end: "18:30", kind: "live", sport: "natacion", venue: "centro-acuatico", [`title_${main}`]: "[EJEMPLO] Natación · Finales" });
  ws.eachRow((row) => row.eachCell((c) => { c.numFmt = "@"; }));
  ws.getColumn("kind").eachCell((c, n) => { if (n > 1) c.dataValidation = { type: "list", allowBlank: false, formulae: [`"${CHANNEL_KINDS.join(",")}"`] }; });
  const codes = wb.addWorksheet("Codes");
  codes.columns = [{ header: "Sport code", key: "s", width: 24 }, { header: "Sport", key: "sn", width: 32 }, { header: "", key: "x", width: 4 }, { header: "Venue code", key: "v", width: 30 }, { header: "Venue", key: "vn", width: 40 }];
  codes.getRow(1).font = { bold: true };
  for (let i = 0; i < Math.max(sports?.length ?? 0, venues?.length ?? 0); i++) codes.addRow({ s: sports?.[i]?.slug, sn: sports?.[i]?.[`title_${main}`], v: venues?.[i]?.slug, vn: venues?.[i]?.[`title_${main}`] });
  const info = wb.addWorksheet("Instructions");
  [
    "One line per programme of the Integrated Channel. Columns with * are required.",
    `Dates as YYYY-MM-DD and times as HH:MM, in ${EVENT.name.replace(/ \d+$/, "")} time (UTC${EVENT.utcOffset}). An end earlier than the start ends the next day.`,
    `Type: ${CHANNEL_KINDS.join(", ")}.`,
    "Sport and venue: codes from the 'Codes' sheet (optional). If the title is empty, the sport's name is shown.",
    "Importing replaces the whole grid of every day that appears in the file; the other days are not touched.",
    "Imported days stay in draft until they are published in the grid editor.",
  ].forEach((l) => info.addRow([l]));
  info.getColumn(1).width = 120;
  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

function cell(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (v instanceof Date) { const iso = v.toISOString(); return iso.startsWith("1899-12-3") ? iso.slice(11, 16) : iso.slice(0, 10); }
  if (typeof v === "number") {
    if (v > 0 && v < 1) { const m = Math.round(v * 1440); return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; }
    return String(v);
  }
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((r) => r.text).join("");
    if ("text" in v) return String(v.text);
    if ("result" in v) return cell(v.result as ExcelJS.CellValue);
  }
  return String(v).trim();
}

export async function parseChannelFile(supabase: SupabaseClient, buf: ArrayBuffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.worksheets[0];
  const [{ data: sports }, { data: venues }] = await Promise.all([supabase.from("sports").select("id,slug"), supabase.from("venues").select("id,slug")]);
  const S = new Map((sports ?? []).map((s) => [s.slug, s.id])), V = new Map((venues ?? []).map((v) => [v.slug, v.id]));
  const header = (ws.getRow(1).values as ExcelJS.CellValue[]).map((v) => cell(v));
  // Columns are found by their header (as in the template); if a header was edited, by position.
  const norm = (h: string) => h.replace(/\s*\*\s*$/, "").trim().toLowerCase();
  const at: Record<string, number> = Object.fromEntries(COLS.map((c, i) => {
    const found = header.findIndex((h, j) => j > 0 && norm(h) === norm(c.header));
    return [c.key, found > 0 ? found : i + 1];
  }));
  const rows: Record<string, unknown>[] = [], errors: string[] = [];
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const g = (k: string) => (at[k] > 0 ? cell(row.getCell(at[k]).value) : "");
    if (!g("date") && !g("start") && !g("kind")) return;
    let start = g("start"), end = g("end");
    start = /^\d:\d\d$/.test(start) ? `0${start}` : start; end = /^\d:\d\d$/.test(end) ? `0${end}` : end;
    const day = g("date"), kind = g("kind").toLowerCase();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return void errors.push(`${n}: date`);
    if (!HHMM.test(start) || (end && !HHMM.test(end))) return void errors.push(`${n}: time`);
    if (!CHANNEL_KINDS.includes(kind as ChannelKind)) return void errors.push(`${n}: type "${g("kind")}"`);
    const sport = g("sport"), venue = g("venue");
    if (sport && !S.has(sport)) return void errors.push(`${n}: sport "${sport}"`);
    if (venue && !V.has(venue)) return void errors.push(`${n}: venue "${venue}"`);
    const r: Record<string, unknown> = { day, start_time: start, end_time: end || null, kind, sport_id: sport ? S.get(sport) : null, venue_id: venue ? V.get(venue) : null, status: "draft" };
    for (const l of LOCALES) { r[`title_${l}`] = g(`title_${l}`).slice(0, 200) || null; r[`notes_${l}`] = g(`notes_${l}`).slice(0, 1000) || null; }
    if (!sport && !LOCALES.some((l) => r[`title_${l}`])) return void errors.push(`${n}: title`);
    rows.push(r);
  });
  return { rows, errors };
}
