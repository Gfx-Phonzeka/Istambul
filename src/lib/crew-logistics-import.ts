import "server-only";
import ExcelJS from "exceljs";
import { norm } from "@/lib/crew-import";

// Travel list (from the travel agency) and rooming list (from the hotels): one Excel each, matched to people by email.
export const TRAVEL_COLUMNS = ["Email *", "Direction * (Outbound / Return / Internal)", "Means (Flight / Train / Car / Bus / Other)", "Company", "Number", "From", "To",
  "Departure date *", "Departure time", "Arrival date", "Arrival time", "Booking ref.", "Transfer (Yes/No)", "Extras", "Notes"];
export const ROOMING_COLUMNS = ["Email *", "Hotel *", "Check-in *", "Check-out *", "Room (Single / Double / Twin / Triple / Other)", "Room code (shared)", "Notes"];

export async function buildTemplate(kind: "travel" | "rooming"): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(kind === "travel" ? "Travel" : "Rooming");
  const cols = kind === "travel" ? TRAVEL_COLUMNS : ROOMING_COLUMNS;
  ws.columns = cols.map((h) => ({ header: h, width: Math.max(12, Math.min(28, h.length)) }));
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.addRow(kind === "travel"
    ? ["name.surname@example.com", "Outbound", "Flight", "TAP", "TP 101", "LIS", "LIM", "2027-07-20", "08:05", "2027-07-20", "17:10", "ABC123", "Yes", "", ""]
    : ["name.surname@example.com", "Hotel name", "2027-07-20", "2027-08-10", "Twin", "R12", ""]);
  ws.getRow(2).font = { italic: true, color: { argb: "FF888888" } };
  for (let r = 2; r <= 1000; r++) {
    if (kind === "travel") {
      ws.getCell(`B${r}`).dataValidation = { type: "list", allowBlank: true, formulae: ['"Outbound,Return,Internal"'] };
      ws.getCell(`C${r}`).dataValidation = { type: "list", allowBlank: true, formulae: ['"Flight,Train,Car,Bus,Other"'] };
      ws.getCell(`M${r}`).dataValidation = { type: "list", allowBlank: true, formulae: ['"Yes,No"'] };
    } else ws.getCell(`E${r}`).dataValidation = { type: "list", allowBlank: true, formulae: ['"Single,Double,Twin,Triple,Other"'] };
  }
  const help = wb.addWorksheet("How to use");
  help.getColumn(1).width = 110;
  (kind === "travel" ? [
    "One line per trip. Email = the person's email in the portal. Dates as YYYY-MM-DD or DD/MM/YYYY, times as HH:MM.",
    "Outbound and return trips mark the travel days (FLY) automatically. Importing again replaces the trip of the same person, direction and departure date.",
  ] : [
    "One line per stay. Email = the person's email in the portal. Hotels that do not exist yet are created.",
    "Same room code = shared room. Importing again replaces the stay of the same person, hotel and check-in date.",
  ]).forEach((t, i) => { help.getCell(`A${i + 1}`).value = t; });
  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

const pad = (n: number) => String(n).padStart(2, "0");
export function asDate(v: ExcelJS.CellValue): string | null {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = text(v);
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s); if (m) return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/.exec(s); if (m) return `${m[3]}-${pad(+m[2])}-${pad(+m[1])}`;
  return null;
}
export function asTime(v: ExcelJS.CellValue): string | null {
  if (v instanceof Date) return `${pad(v.getUTCHours())}:${pad(v.getUTCMinutes())}`;
  if (typeof v === "number" && v < 1) { const mins = Math.round(v * 1440); return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`; }
  const m = /^(\d{1,2})[:h.](\d{2})/.exec(text(v)); return m ? `${pad(+m[1])}:${m[2]}` : null;
}
export function text(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (typeof v === "object" && !(v instanceof Date)) {
    if ("richText" in v) return v.richText.map((r) => r.text).join("").trim();
    if ("text" in v) return String(v.text).trim();
    if ("hyperlink" in v) return String((v as { hyperlink: string }).hyperlink).replace(/^mailto:/, "").trim();
    if ("result" in v) return v.result == null ? "" : text(v.result as ExcelJS.CellValue);
  }
  return String(v).trim();
}

/** Reads the first sheet into rows keyed by the first word of each header (email, direction, means…). */
export async function readRows(file: File): Promise<{ line: number; cells: ExcelJS.CellValue[] }[] | null> {
  const wb = new ExcelJS.Workbook();
  try { await wb.xlsx.load(await file.arrayBuffer()); } catch { return null; }
  const ws = wb.worksheets[0];
  if (!ws) return null;
  const rows: { line: number; cells: ExcelJS.CellValue[] }[] = [];
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const cells = (row.values as ExcelJS.CellValue[]).slice(1);
    const email = text(cells[0]).toLowerCase();
    if (!email || email === "name.surname@example.com") return;
    rows.push({ line: n, cells });
  });
  return rows.slice(0, 2000);
}
export { norm };
