import "server-only";
import ExcelJS from "exceljs";
import { EVENT } from "@/lib/event";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import type { SupabaseClient } from "@supabase/supabase-js";

// Crew Ops: one Excel file with the whole crew (accounts + function + teams + type + company).
export const CREW_COLUMNS = [
  { key: "email", header: "Email *", width: 32 },
  { key: "first_name", header: "First name *", width: 16 },
  { key: "last_name", header: "Last name *", width: 20 },
  { key: "phone", header: "Phone", width: 18 },
  { key: "lang", header: `Language (${EVENT.locales.join("/")})`, width: 12 },
  { key: "function", header: "Function", width: 32 },
  { key: "position", header: "Position (e.g. Cam 3)", width: 18 },
  { key: "teams", header: "Teams (comma separated)", width: 30 },
  { key: "type", header: "Type (Freelancer / Employee / Group company)", width: 22 },
  { key: "company", header: "Company", width: 20 },
  { key: "venue", header: "Venue (optional)", width: 28 },
  { key: "mediagest", header: "In Mediagest (Yes/No)", width: 12 },
] as const;
type Key = (typeof CREW_COLUMNS)[number]["key"];
export type CrewRow = Record<Key, string>;

export const norm = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
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

export async function buildCrewTemplate(supabase: SupabaseClient): Promise<ArrayBuffer> {
  const [{ data: fns }, { data: teams }, { data: venues }] = await Promise.all([
    supabase.from("crew_functions").select("name_en,area").eq("active", true).order("position"),
    supabase.from("crew_teams").select("name").order("name"),
    supabase.from("venues").select(`title:title_${DEFAULT_LOCALE}` as "*").order(`title_${DEFAULT_LOCALE}`),
  ]);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Crew");
  ws.columns = CREW_COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.addRow({ email: "name.surname@example.com", first_name: "Name", last_name: "Surname", phone: "+351 900 000 000", lang: EVENT.locales[0],
    function: "Camera Operator", position: "Cam 3", teams: "Operational A, PU 2 technical", type: "Freelancer", company: "", venue: "", mediagest: "No" });
  ws.getRow(2).font = { italic: true, color: { argb: "FF888888" } };
  const lists = wb.addWorksheet("Lists");
  lists.columns = [{ header: "Functions", width: 40 }, { header: "Teams (existing)", width: 30 }, { header: "Types", width: 18 }, { header: "Venues", width: 40 }];
  lists.getRow(1).font = { bold: true };
  const F = (fns ?? []) as { name_en: string }[]; const T = (teams ?? []) as { name: string }[]; const V = (venues ?? []) as unknown as { title: string }[];
  const types = ["Freelancer", "Employee", "Group company"];
  for (let i = 0; i < Math.max(F.length, T.length, types.length, V.length); i++) lists.addRow([F[i]?.name_en ?? "", T[i]?.name ?? "", types[i] ?? "", V[i]?.title ?? ""]);
  for (let r = 2; r <= 500; r++) {
    if (F.length) ws.getCell(`F${r}`).dataValidation = { type: "list", allowBlank: true, formulae: [`Lists!$A$2:$A$${F.length + 1}`] };
    ws.getCell(`I${r}`).dataValidation = { type: "list", allowBlank: true, formulae: ['"Freelancer,Employee,Group company"'] };
    ws.getCell(`L${r}`).dataValidation = { type: "list", allowBlank: true, formulae: ['"Yes,No"'] };
    if (V.length) ws.getCell(`K${r}`).dataValidation = { type: "list", allowBlank: true, formulae: [`Lists!$D$2:$D$${V.length + 1}`] };
  }
  const help = wb.addWorksheet("How to use");
  help.getColumn(1).width = 110;
  [
    "How to fill in this file",
    "1. One line per person in the 'Crew' sheet. Delete the grey example line.",
    "2. Email, first name and last name are required. The rest is optional and can be completed later in the portal.",
    "3. Function: choose from the list (names in English). Teams: several separated by commas; teams that do not exist are created.",
    "4. Upload it in Crew Ops > People > Import. Importing again updates the same people (matched by email).",
    "5. Accounts are created without a password: send the invitations from Backoffice > Production team.",
    "6. Personal data (document, date of birth, sizes, photo) is filled in by each person in 'My crew sheet'.",
  ].forEach((line, i) => { const c = help.getCell(`A${i + 1}`); c.value = line; if (i === 0) c.font = { bold: true, size: 13 }; });
  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

export async function readCrewFile(file: File): Promise<{ rows: { line: number; data: CrewRow }[] } | { error: string }> {
  const wb = new ExcelJS.Workbook();
  try { await wb.xlsx.load(await file.arrayBuffer()); } catch { return { error: "unreadable" }; }
  const ws = wb.getWorksheet("Crew") ?? wb.worksheets[0];
  if (!ws) return { error: "unreadable" };
  const header = (ws.getRow(1).values as ExcelJS.CellValue[]).map((v) => norm(cellText(v)));
  const col = (k: Key) => { const h = norm(CREW_COLUMNS.find((c) => c.key === k)!.header); const short = norm(h.split(/[(*]/)[0]); return header.findIndex((x) => x && (x === h || x.startsWith(short))); };
  const idx = Object.fromEntries(CREW_COLUMNS.map((c) => [c.key, col(c.key)])) as Record<Key, number>;
  if (idx.email < 0 || idx.first_name < 0 || idx.last_name < 0) return { error: "missing_columns" };
  const rows: { line: number; data: CrewRow }[] = [];
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const v = row.values as ExcelJS.CellValue[];
    const data = Object.fromEntries(CREW_COLUMNS.map((c) => [c.key, idx[c.key] >= 0 ? cellText(v[idx[c.key]]) : ""])) as CrewRow;
    if (!data.email && !data.first_name && !data.last_name) return;
    if (data.email === "name.surname@example.com") return;
    rows.push({ line: n, data });
  });
  return { rows: rows.slice(0, 1000) };
}
