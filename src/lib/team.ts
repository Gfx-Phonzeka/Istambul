import "server-only";
import ExcelJS from "exceljs";
import type { SupabaseClient } from "@supabase/supabase-js";

// Production team: functions offered in the import template, template builder and file reader.
export const TEAM_FUNCTIONS = [
  "Producer", "Director", "Assistant director", "Camera operator", "EVS operator", "Graphics operator", "Audio",
  "Vision engineer", "Broadcast Venue Manager (BVM)", "Assistant BVM", "Venue Technical Manager (VTM)",
  "Production Quality Control (PQC)", "Distribution (CDT)", "Other",
];

export const TEAM_COLUMNS = [
  { key: "email", header: "Email *", width: 32 },
  { key: "first_name", header: "First name *", width: 18 },
  { key: "last_name", header: "Last name *", width: 20 },
  { key: "function", header: "Function *", width: 30 },
  { key: "phone", header: "Phone", width: 18 },
  { key: "lang", header: "Language (en/tr)", width: 12 },
  { key: "organization", header: "Organisation (default Medialuso)", width: 22 },
  { key: "venue", header: "Venue (optional)", width: 30 },
  { key: "sport", header: "Sport (optional)", width: 22 },
] as const;

export type TeamRow = Record<(typeof TEAM_COLUMNS)[number]["key"], string>;

const norm = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");

function cellText(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((r) => r.text).join("").trim();
    if ("text" in v) return String(v.text).trim();
    if ("hyperlink" in v) return String((v as { hyperlink: string }).hyperlink).replace(/^mailto:/, "").trim();
    if ("result" in v) return v.result == null ? "" : cellText(v.result as ExcelJS.CellValue);
  }
  return String(v).trim();
}

export async function buildTeamTemplate(supabase: SupabaseClient): Promise<ArrayBuffer> {
  const [{ data: venues }, { data: sports }] = await Promise.all([
    supabase.from("venues").select("title_en").order("title_en"),
    supabase.from("sports").select("title_en").order("title_en"),
  ]);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Team");
  ws.columns = TEAM_COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.addRow({ email: "name.surname@example.com", first_name: "Name", last_name: "Surname", function: "Director", phone: "+351 900 000 000", lang: "en", organization: "Medialuso", venue: "", sport: "" });
  ws.getRow(2).font = { italic: true, color: { argb: "FF888888" } };

  const lists = wb.addWorksheet("Lists");
  lists.columns = [{ header: "Functions", width: 32 }, { header: "Venues", width: 40 }, { header: "Sports", width: 26 }];
  lists.getRow(1).font = { bold: true };
  const max = Math.max(TEAM_FUNCTIONS.length, venues?.length ?? 0, sports?.length ?? 0);
  for (let i = 0; i < max; i++) lists.addRow([TEAM_FUNCTIONS[i] ?? "", venues?.[i]?.title_en ?? "", sports?.[i]?.title_en ?? ""]);
  const end = (n: number) => n + 1;
  for (let r = 2; r <= 300; r++) {
    ws.getCell(`D${r}`).dataValidation = { type: "list", allowBlank: true, formulae: [`Lists!$A$2:$A$${end(TEAM_FUNCTIONS.length)}`] };
    ws.getCell(`F${r}`).dataValidation = { type: "list", allowBlank: true, formulae: ['"en,tr"'] };
    if (venues?.length) ws.getCell(`H${r}`).dataValidation = { type: "list", allowBlank: true, formulae: [`Lists!$B$2:$B$${end(venues.length)}`] };
    if (sports?.length) ws.getCell(`I${r}`).dataValidation = { type: "list", allowBlank: true, formulae: [`Lists!$C$2:$C$${end(sports.length)}`] };
  }
  const help = wb.addWorksheet("How to use");
  help.getColumn(1).width = 110;
  [
    "How to fill in this file",
    "1. One line per person in the 'Team' sheet. Delete the grey example line.",
    "2. Columns marked * are required. Function, Language, Venue and Sport can be chosen from the lists.",
    "3. Venue and Sport are optional: use them for the person's main assignment.",
    "4. Upload the file in the portal: Backoffice > Production team > Import.",
    "5. Importing the same file again updates the people already in the portal (matched by email).",
    "6. Accounts are created without a password. Send the invitation from the portal so each person chooses their own.",
  ].forEach((line, i) => { const c = help.getCell(`A${i + 1}`); c.value = line; if (i === 0) c.font = { bold: true, size: 13 }; });
  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

/** Reads the uploaded file into rows, resolving venue and sport names to ids. */
export async function readTeamFile(supabase: SupabaseClient, file: File) {
  const wb = new ExcelJS.Workbook();
  try {
    if (file.name.toLowerCase().endsWith(".csv")) {
      const { Readable } = await import("node:stream");
      await wb.csv.read(Readable.from(Buffer.from(await file.arrayBuffer())));
    } else {
      await wb.xlsx.load(await file.arrayBuffer());
    }
  } catch {
    return { error: "unreadable" as const };
  }
  const ws = wb.getWorksheet("Team") ?? wb.worksheets[0];
  if (!ws) return { error: "unreadable" as const };
  const headers = (ws.getRow(1).values as ExcelJS.CellValue[]).map((v) => norm(cellText(v)));
  const idx: Partial<Record<keyof TeamRow, number>> = {};
  for (const c of TEAM_COLUMNS) {
    const i = headers.findIndex((h) => h && h.startsWith(norm(c.header.replace(/\s*\(.*$/, "").replace("*", ""))));
    if (i > 0) idx[c.key] = i;
  }
  const missing = (["email", "first_name", "last_name", "function"] as const).filter((k) => !idx[k]);
  if (missing.length) return { error: "missing_columns" as const, missing };

  const [{ data: venues }, { data: sports }] = await Promise.all([
    supabase.from("venues").select("id,title_en,slug"), supabase.from("sports").select("id,title_en,slug"),
  ]);
  const find = (list: { id: string; title_en: string; slug: string }[] | null, v: string) =>
    v ? (list ?? []).find((x) => norm(x.title_en) === norm(v) || norm(x.slug) === norm(v))?.id ?? null : null;

  const rows: { line: number; data: TeamRow; venue_id: string | null; sport_id: string | null; problem?: string }[] = [];
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const get = (k: keyof TeamRow) => (idx[k] ? cellText(row.getCell(idx[k]!).value) : "");
    const data = Object.fromEntries(TEAM_COLUMNS.map((c) => [c.key, get(c.key)])) as TeamRow;
    if (!Object.values(data).some(Boolean)) return;
    if (data.email === "name.surname@example.com") return;
    const venue_id = find(venues, data.venue), sport_id = find(sports, data.sport);
    let problem: string | undefined;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) problem = "invalid_email";
    else if (!data.first_name || !data.last_name || !data.function) problem = "missing_fields";
    else if (data.venue && !venue_id) problem = "unknown_venue";
    else if (data.sport && !sport_id) problem = "unknown_sport";
    rows.push({ line: n, data, venue_id, sport_id, problem });
  });
  return { rows };
}
