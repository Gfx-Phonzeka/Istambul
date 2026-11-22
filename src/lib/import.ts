import "server-only";
import ExcelJS from "exceljs";
import type { SupabaseClient } from "@supabase/supabase-js";

export type Dataset = "sessions" | "feeds";
export const DATASETS: Dataset[] = ["sessions", "feeds"];

interface Col { key: string; header: string; required?: boolean; width?: number }

export const COLUMNS: Record<Dataset, Col[]> = {
  sessions: [
    { key: "code", header: "Code", required: true, width: 14 },
    { key: "date", header: "Date (YYYY-MM-DD)", required: true, width: 16 },
    { key: "start", header: "Start (HH:MM, Istanbul)", required: true, width: 12 },
    { key: "end", header: "End (HH:MM, Istanbul)", required: true, width: 12 },
    { key: "sport", header: "Sport (code or name)", required: true, width: 18 },
    { key: "venue", header: "Venue (code or name)", required: true, width: 22 },
    { key: "discipline_en", header: "Discipline EN", width: 16 },
    { key: "discipline_tr", header: "Discipline TR", width: 16 },
    { key: "phase_en", header: "Phase EN", required: true, width: 28 },
    { key: "phase_tr", header: "Phase TR", width: 28 },
    { key: "is_medal", header: "Medal (yes/no)", width: 10 },
    { key: "medal_events_en", header: "Medal events EN", width: 28 },
    { key: "medal_events_tr", header: "Medal events TR", width: 28 },
    { key: "is_oq", header: "OQ LA28 (yes/no)", width: 10 },
    { key: "notes_en", header: "Notes EN", width: 20 },
    { key: "notes_tr", header: "Notes TR", width: 20 },
  ],
  feeds: [
    { key: "code", header: "Code", required: true, width: 16 },
    { key: "date", header: "Date (YYYY-MM-DD)", required: true, width: 16 },
    { key: "start", header: "Start (HH:MM, Istanbul)", required: true, width: 12 },
    { key: "end", header: "End (HH:MM, Istanbul)", required: true, width: 12 },
    { key: "feed_type", header: "Type (multilateral/iso/highlights/ceremony/other)", required: true, width: 18 },
    { key: "title_en", header: "Title EN", required: true, width: 32 },
    { key: "title_tr", header: "Title TR", width: 32 },
    { key: "venue", header: "Venue (code or name, optional)", width: 22 },
    { key: "sport", header: "Sport (code or name, optional)", width: 18 },
    { key: "channel", header: "Channel", required: true, width: 18 },
    { key: "notes_en", header: "Notes EN", width: 20 },
    { key: "notes_tr", header: "Notes TR", width: 20 },
  ],
};

const FEED_TYPES = ["multilateral", "iso", "highlights", "ceremony", "other"];
const norm = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\[exemplo\]/g, "").replace(/[^a-z0-9]+/g, "");

function cellText(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (v instanceof Date) {
    // Excel dates/times: a pure time is stored on 1899-12-30
    const iso = v.toISOString();
    return iso.startsWith("1899-12-30") || iso.startsWith("1899-12-31") ? iso.slice(11, 16) : iso.slice(0, 10);
  }
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((r) => r.text).join("");
    if ("text" in v) return String(v.text);
    if ("result" in v) return v.result == null ? "" : cellText(v.result as ExcelJS.CellValue);
  }
  return String(v).trim();
}

function parseCsv(text: string): string[][] {
  const sep = (text.split("\n")[0].match(/;/g)?.length ?? 0) > (text.split("\n")[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c;
    } else if (c === '"') q = true;
    else if (c === sep) { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cur); rows.push(row); row = []; cur = "";
    } else cur += c;
  }
  if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim() !== ""));
}

/** Reads an .xlsx or .csv file into rows keyed by column key (header names are matched loosely). */
export async function readFile(dataset: Dataset, file: File): Promise<{ rows: Record<string, string>[]; error?: string }> {
  let table: string[][];
  const buf = Buffer.from(await file.arrayBuffer());
  if (/\.csv$/i.test(file.name) || file.type === "text/csv") {
    table = parseCsv(buf.toString("utf8").replace(/^﻿/, ""));
  } else {
    const wb = new ExcelJS.Workbook();
    try { await wb.xlsx.load(buf as unknown as ArrayBuffer); } catch { return { rows: [], error: "unreadable" }; }
    const ws = wb.worksheets[0];
    if (!ws) return { rows: [], error: "unreadable" };
    table = [];
    ws.eachRow({ includeEmpty: false }, (r) => {
      const vals: string[] = [];
      for (let c = 1; c <= ws.columnCount; c++) vals.push(cellText(r.getCell(c).value));
      table.push(vals);
    });
  }
  if (table.length < 1) return { rows: [], error: "empty" };
  const cols = COLUMNS[dataset];
  const header = table[0].map((h) => norm(h));
  const idx = cols.map((c) => {
    const want = norm(c.header);
    const short = norm(c.header.replace(/\(.*\)/, ""));
    return header.findIndex((h) => h === want || h === short || h === norm(c.key));
  });
  const missing = cols.filter((c, i) => c.required && idx[i] < 0).map((c) => c.header);
  if (missing.length) return { rows: [], error: `missing_columns:${missing.join(" | ")}` };
  const rows = table.slice(1).map((r) => Object.fromEntries(cols.map((c, i) => [c.key, idx[i] >= 0 ? (r[idx[i]] ?? "").trim() : ""])));
  return { rows };
}

export interface RowIssue { row: number; code: string; message: string }
export interface PreviewItem { code: string; status: "new" | "changed" | "unchanged"; changes: string[]; label: string }
export interface ImportPreview { items: PreviewItem[]; removed: { code: string; label: string }[]; errors: RowIssue[]; total: number }

const yes = (s: string) => /^(y|yes|sim|evet|true|1|x|✓)$/i.test(s.trim());

function toIso(date: string, time: string): string | null {
  const d = date.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/) ?? date.trim().match(/^(\d{2})[/.](\d{2})[/.](\d{4})$/);
  if (!d) return null;
  const [y, m, day] = d[1].length === 4 ? [d[1], d[2], d[3]] : [d[3], d[2], d[1]];
  const t = time.trim().match(/^(\d{1,2})[:.h](\d{2})/);
  if (!t) return null;
  const iso = `${y}-${m}-${day}T${t[1].padStart(2, "0")}:${t[2]}:00+03:00`;
  return Number.isNaN(new Date(iso).getTime()) ? null : iso;
}

/** Validates rows, resolves sports/venues and compares with the current data. */
export async function buildPreview(supabase: SupabaseClient, dataset: Dataset, raw: Record<string, string>[]) {
  const [{ data: sports }, { data: venues }] = await Promise.all([
    supabase.from("sports").select("id,slug,title_en,title_tr"),
    supabase.from("venues").select("id,slug,title_en,title_tr"),
  ]);
  const find = (list: { id: string; slug: string; title_en: string; title_tr: string | null }[] | null, v: string) => {
    const n = norm(v);
    return (list ?? []).find((x) => norm(x.slug) === n || norm(x.title_en) === n || (x.title_tr && norm(x.title_tr) === n));
  };
  const errors: RowIssue[] = [];
  const clean: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  raw.forEach((r, i) => {
    const rowNo = i + 2; // header is row 1
    const code = r.code?.trim() ?? "";
    const err = (m: string) => errors.push({ row: rowNo, code, message: m });
    if (!code) return err("code_missing");
    if (seen.has(code.toLowerCase())) return err("code_duplicate");
    seen.add(code.toLowerCase());
    const start = toIso(r.date ?? "", r.start ?? "");
    let end = toIso(r.date ?? "", r.end ?? "");
    if (!start || !end) return err("date_invalid");
    if (new Date(end) < new Date(start)) end = new Date(new Date(end).getTime() + 86400000).toISOString(); // ends after midnight
    if (dataset === "sessions") {
      const sp = find(sports, r.sport ?? ""), ve = find(venues, r.venue ?? "");
      if (!sp) return err(`sport_unknown:${r.sport}`);
      if (!ve) return err(`venue_unknown:${r.venue}`);
      if (!r.phase_en) return err("phase_missing");
      clean.push({
        code, sport_id: sp.id, venue_id: ve.id, start_at: start, end_at: end, discipline_en: r.discipline_en || null, discipline_tr: r.discipline_tr || null,
        phase_en: r.phase_en, phase_tr: r.phase_tr || null, is_medal: yes(r.is_medal ?? ""), medal_events_en: r.medal_events_en || null,
        medal_events_tr: r.medal_events_tr || null, is_oq: yes(r.is_oq ?? ""), notes_en: r.notes_en || null, notes_tr: r.notes_tr || null,
      });
    } else {
      const type = (r.feed_type ?? "").trim().toLowerCase();
      if (!FEED_TYPES.includes(type)) return err(`type_invalid:${r.feed_type}`);
      if (!r.title_en) return err("title_missing");
      if (!r.channel) return err("channel_missing");
      const ve = r.venue ? find(venues, r.venue) : null, sp = r.sport ? find(sports, r.sport) : null;
      if (r.venue && !ve) return err(`venue_unknown:${r.venue}`);
      if (r.sport && !sp) return err(`sport_unknown:${r.sport}`);
      clean.push({
        code, feed_type: type, title_en: r.title_en, title_tr: r.title_tr || null, venue_id: ve?.id ?? null, sport_id: sp?.id ?? null,
        start_at: start, end_at: end, channel: r.channel, notes_en: r.notes_en || null, notes_tr: r.notes_tr || null,
      });
    }
  });

  const table = dataset === "sessions" ? "schedule_sessions" : "broadcast_feeds";
  const { data: existing } = await supabase.from(table).select("*");
  const byCode = new Map((existing ?? []).map((e) => [e.code as string, e as Record<string, unknown>]));
  const label = (r: Record<string, unknown>) => dataset === "sessions"
    ? `${(sports ?? []).find((s) => s.id === r.sport_id)?.title_en ?? ""} · ${r.phase_en ?? ""}`
    : String(r.title_en ?? "");
  const same = (a: unknown, b: unknown, k: string) =>
    k.endsWith("_at") ? new Date(String(a)).getTime() === new Date(String(b)).getTime() : (a ?? null) === (b ?? null);
  const items: PreviewItem[] = clean.map((r) => {
    const e = byCode.get(r.code as string);
    if (!e) return { code: r.code as string, status: "new", changes: [], label: label(r) };
    const changes = Object.keys(r).filter((k) => k !== "code" && !same(r[k], e[k], k));
    return { code: r.code as string, status: changes.length ? "changed" : "unchanged", changes, label: label(r) };
  });
  const codes = new Set(clean.map((r) => r.code as string));
  const removed = (existing ?? []).filter((e) => !codes.has(e.code)).map((e) => ({ code: e.code as string, label: label(e) }));
  return { preview: { items, removed, errors, total: raw.length } as ImportPreview, rows: clean };
}

/** Excel template with the current data (so it can be edited and re-imported) and a sheet with valid codes. */
export async function buildTemplate(supabase: SupabaseClient, dataset: Dataset): Promise<ArrayBuffer> {
  const [{ data: sports }, { data: venues }] = await Promise.all([
    supabase.from("sports").select("id,slug,title_en").order("position"),
    supabase.from("venues").select("id,slug,title_en").order("title_en"),
  ]);
  const S = new Map((sports ?? []).map((s) => [s.id, s.slug]));
  const V = new Map((venues ?? []).map((v) => [v.id, v.slug]));
  const table = dataset === "sessions" ? "schedule_sessions" : "broadcast_feeds";
  const { data: rows } = await supabase.from(table).select("*").order("start_at");
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(dataset === "sessions" ? "Sessions" : "Feeds");
  ws.columns = COLUMNS[dataset].map((c) => ({ header: c.header + (c.required ? " *" : ""), key: c.key, width: c.width ?? 16 }));
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  const ist = (iso: string) => {
    const d = new Date(new Date(iso).getTime() + 3 * 3600000).toISOString();
    return { date: d.slice(0, 10), time: d.slice(11, 16) };
  };
  for (const r of rows ?? []) {
    const s = ist(r.start_at), e = ist(r.end_at);
    ws.addRow({
      ...r, date: s.date, start: s.time, end: e.time, sport: r.sport_id ? S.get(r.sport_id) : "", venue: r.venue_id ? V.get(r.venue_id) : "",
      is_medal: r.is_medal ? "yes" : dataset === "sessions" ? "no" : undefined, is_oq: r.is_oq ? "yes" : dataset === "sessions" ? "no" : undefined,
    });
  }
  ws.eachRow((row) => row.eachCell((c) => { c.numFmt = "@"; })); // keep dates/times as text
  const help = wb.addWorksheet("Codes");
  help.columns = [{ header: "Sport code", key: "s", width: 22 }, { header: "Sport", key: "sn", width: 30 }, { header: "", key: "x", width: 4 },
    { header: "Venue code", key: "v", width: 22 }, { header: "Venue", key: "vn", width: 34 }];
  help.getRow(1).font = { bold: true };
  const n = Math.max(sports?.length ?? 0, venues?.length ?? 0);
  for (let i = 0; i < n; i++) help.addRow({ s: sports?.[i]?.slug, sn: sports?.[i]?.title_en, v: venues?.[i]?.slug, vn: venues?.[i]?.title_en });
  const info = wb.addWorksheet("Instructions");
  [
    "Fill one line per item. Columns marked * are required.",
    "Code identifies each line: a line whose code already exists updates it; a new code creates a new line.",
    "Dates as YYYY-MM-DD, times as HH:MM in Istanbul time (TRT, UTC+3). An end time earlier than the start means the next day.",
    "Sport and venue: use the codes from the 'Codes' sheet (or the exact names).",
    "Yes/no columns accept: yes, no, sim, não, evet, hayır, 1, 0, x.",
    "Before anything is changed, the portal shows a preview of new, changed and removed lines and any errors.",
  ].forEach((l) => info.addRow([l]));
  info.getColumn(1).width = 120;
  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}
