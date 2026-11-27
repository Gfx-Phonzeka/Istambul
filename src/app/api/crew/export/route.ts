import ExcelJS from "exceljs";
import { NextResponse, type NextRequest } from "next/server";
import { EVENT } from "@/lib/event";
import { getProfile } from "@/lib/auth";
import { isCrewCoord } from "@/lib/crew-server";
import { loadCrew, type CrewPerson } from "@/lib/crew-data";

export const dynamic = "force-dynamic";

type Col = { header: string; width: number; get: (p: CrewPerson) => unknown };
const r = (k: string) => (p: CrewPerson) => (p.record as Record<string, unknown> | null)?.[k] ?? null;
const date = (k: string) => (p: CrewPerson) => { const v = r(k)(p); return v ? new Date(String(v)) : null; };
const TYPE: Record<string, string> = { freelancer: "Freelancer", employee: "Employee", group_company: "Group company" };
const BASE: Col[] = [
  { header: "First name", width: 16, get: (p) => p.first_name },
  { header: "Last name", width: 18, get: (p) => p.last_name },
  { header: "Function", width: 28, get: (p) => p.functionName },
  { header: "Position", width: 16, get: (p) => p.position_label },
  { header: "Teams", width: 28, get: (p) => p.teamNames.join(", ") },
];
const CONTACTS: Col[] = [
  { header: "Email", width: 32, get: (p) => p.email },
  { header: "Phone", width: 18, get: (p) => p.phone },
  { header: "Emergency contact", width: 22, get: r("emergency_name") },
  { header: "Emergency phone", width: 18, get: r("emergency_phone") },
];
const UNIFORM: Col[] = [{ header: "Polo", width: 8, get: r("polo_size") }, { header: "Hoodie", width: 8, get: r("hoodie_size") }];
const ACCRED: Col[] = [
  { header: "Nationality", width: 16, get: r("nationality") },
  { header: "Date of birth", width: 14, get: date("date_of_birth") },
  { header: "Gender", width: 10, get: r("gender") },
  { header: "Document type", width: 14, get: r("id_type") },
  { header: "Document number", width: 18, get: r("id_number") },
  { header: "Document expiry", width: 14, get: date("id_expiry") },
  { header: "Photo", width: 8, get: (p) => (p.record?.photo_path ? "Yes" : "No") },
];
const KINDS: Record<string, Col[]> = {
  contacts: [...BASE, ...CONTACTS],
  uniforms: [...BASE, ...UNIFORM],
  accreditation: [...BASE, ...ACCRED],
  full: [...BASE,
    { header: "Type", width: 14, get: (p) => (p.collaborator_type ? TYPE[p.collaborator_type] : null) },
    { header: "Company", width: 18, get: (p) => p.company },
    ...CONTACTS, ...ACCRED, ...UNIFORM,
    { header: "Languages", width: 18, get: r("languages") },
    { header: "Data complete", width: 12, get: (p) => p.pct / 100 },
    { header: "Notes", width: 30, get: (p) => p.notes }],
};

/** Crew lists for accreditation, uniforms and logistics. Only Crew Ops coordination and admins. */
export async function GET(req: NextRequest) {
  const me = await getProfile();
  if (!me || me.status !== "approved" || !(await isCrewCoord())) return new NextResponse("Forbidden", { status: 403 });
  const kind = req.nextUrl.searchParams.get("kind") ?? "full";
  const cols = KINDS[kind];
  if (!cols) return new NextResponse("Not found", { status: 404 });
  const { people } = await loadCrew("en");
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Crew");
  ws.columns = cols.map((c, i) => ({ header: c.header, key: `c${i}`, width: c.width }));
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  for (const p of people) ws.addRow(Object.fromEntries(cols.map((c, i) => [`c${i}`, c.get(p)])));
  cols.forEach((c, i) => {
    if (c.header.startsWith("Date") || c.header.endsWith("expiry")) ws.getColumn(i + 1).numFmt = "dd/mm/yyyy";
    if (c.header === "Data complete") ws.getColumn(i + 1).numFmt = "0%";
  });
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } };
  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${EVENT.slug}-crew-${kind}-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
