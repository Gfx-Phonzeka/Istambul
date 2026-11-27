import ExcelJS from "exceljs";
import { NextResponse, type NextRequest } from "next/server";
import { EVENT } from "@/lib/event";
import { getProfile } from "@/lib/auth";
import { isCrewCoord, isCrewFinance } from "@/lib/crew-server";
import { loadFinance, personCost } from "@/lib/crew-costs";
import { loadCrew, type CrewPerson } from "@/lib/crew-data";
import { DAY_CODE, eachDay, loadPlan, personDays, planRange } from "@/lib/crew-days";
import { hotelOn, loadLogistics, nights } from "@/lib/crew-logistics";

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
    { header: "Mediagest", width: 11, get: (p) => (p.in_mediagest ? "Yes" : "No") },
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
  if (kind === "days") return daysWorkbook(req);
  if (kind === "costs") return (await isCrewFinance()) ? costsWorkbook() : new NextResponse("Forbidden", { status: 403 });
  if (kind === "travel" || kind === "rooming" || kind === "transfers") return logisticsWorkbook(kind, req);
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

/** Crew control: one row per person, one column per day with the day code (FLY, SET UP, REH, MD, OFF…) and the unit. */
async function daysWorkbook(req: NextRequest) {
  const [{ people, teams }, plan] = await Promise.all([loadCrew("en"), loadPlan()]);
  const team = req.nextUrl.searchParams.get("team"); const unit = req.nextUrl.searchParams.get("unit");
  const range = planRange(plan);
  const dates = range ? eachDay(range[0], range[1]) : [];
  const U = new Map(plan.units.map((u) => [u.id, u.code]));
  const T = new Map(teams.map((t) => [t.id, t.name]));
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Crew control");
  const fixed = ["Function", "Position", "First name", "Last name", "Teams", "Type", "Company", "Mediagest"];
  ws.columns = [...fixed.map((h) => ({ header: h, width: h === "Function" ? 26 : 14 })), ...dates.map((d) => ({ header: d.slice(5).split("-").reverse().join("/"), width: 9 })), { header: "Total days", width: 10 }];
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", xSplit: 4, ySplit: 1 }];
  const FILL: Record<string, string> = { travel: "FFDBE7F7", setup: "FFFDE9C8", rehearsal: "FFFFF3B0", check: "FFE6DCF7", live: "FFCDEBD6", off: "FFECECEC", dismantle: "FFF7D9D4", office: "FFD6EEF0" };
  for (const p of people) {
    if (team && !p.teamIds.includes(team)) continue;
    const days = personDays(plan, p.id);
    if (unit && ![...days.values()].some((d) => d.unitId === unit)) continue;
    const row = ws.addRow([p.functionName, p.position_label, p.first_name, p.last_name, p.teamIds.map((id) => T.get(id)).filter(Boolean).join(", "),
      p.collaborator_type ?? "", p.company ?? "", p.in_mediagest ? "Yes" : "No",
      ...dates.map((d) => { const x = days.get(d); return x ? `${DAY_CODE[x.type]}${x.unitId ? ` ${U.get(x.unitId)}` : ""}` : ""; }), days.size]);
    dates.forEach((d, i) => {
      const x = days.get(d);
      if (x) row.getCell(fixed.length + i + 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: FILL[x.type] } };
    });
  }
  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${EVENT.slug}-crew-control-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}

const xlsx = async (wb: ExcelJS.Workbook, name: string) => new NextResponse((await wb.xlsx.writeBuffer()) as ArrayBuffer, {
  headers: {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="${EVENT.slug}-${name}-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    "Cache-Control": "no-store",
  },
});

/** Travel list, rooming list (per hotel) and transfers (arrivals/departures). */
async function logisticsWorkbook(kind: "travel" | "rooming" | "transfers", req: NextRequest) {
  const [{ people }, { travels, hotels, stays }] = await Promise.all([loadCrew("en"), loadLogistics()]);
  const P = new Map(people.map((p) => [p.id, p]));
  const H = new Map(hotels.map((h) => [h.id, h]));
  const who = (id: string) => P.get(id);
  const wb = new ExcelJS.Workbook();
  if (kind === "travel") {
    const ws = wb.addWorksheet("Travel");
    ws.addRow(["First name", "Last name", "Function", "Direction", "Means", "Company", "Number", "From", "To", "Departure date", "Departure time", "Arrival date", "Arrival time", "Booking ref.", "Transfer", "Extras", "Notes"]);
    for (const t of travels) { const p = who(t.profile_id); ws.addRow([p?.first_name, p?.last_name, p?.functionName, t.direction, t.mode, t.carrier, t.number, t.from_place, t.to_place, t.depart_date, t.depart_time, t.arrive_date, t.arrive_time, t.booking_ref, t.transfer_needed ? "Yes" : "No", t.extras, t.notes]); }
  } else if (kind === "rooming") {
    const only = req.nextUrl.searchParams.get("hotel");
    for (const h of hotels.filter((x) => !only || x.id === only)) {
      const ws = wb.addWorksheet(h.name.replace(/[\\/?*[\]:]/g, " ").slice(0, 31));
      ws.addRow([h.name, h.address ?? "", h.city ?? ""]).font = { bold: true };
      ws.addRow([]);
      ws.addRow(["Room code", "Room type", "Last name", "First name", "Check-in", "Check-out", "Nights", "Notes"]).font = { bold: true };
      for (const s of stays.filter((x) => x.hotel_id === h.id).sort((a, b) => (a.room_code ?? "~").localeCompare(b.room_code ?? "~") || a.check_in.localeCompare(b.check_in))) {
        const p = who(s.profile_id);
        ws.addRow([s.room_code, s.room_type, p?.last_name, p?.first_name, s.check_in, s.check_out, nights(s.check_in, s.check_out), s.notes]);
      }
      ws.columns.forEach((col) => { col.width = 16; });
    }
    if (!wb.worksheets.length) wb.addWorksheet("Rooming list");
  } else {
    const ws = wb.addWorksheet("Transfers");
    ws.addRow(["Date", "Time", "Arrival / departure", "Last name", "First name", "Phone", "Company", "Number", "From", "To", "Hotel"]).font = { bold: true };
    const rows: (string | null | undefined)[][] = [];
    for (const t of travels.filter((x) => x.transfer_needed)) {
      const p = who(t.profile_id);
      if (t.direction !== "return" && t.arrive_date) { const st = hotelOn(stays, t.profile_id, t.arrive_date); rows.push([t.arrive_date, t.arrive_time, "Arrival", p?.last_name, p?.first_name, p?.phone, t.carrier, t.number, t.from_place, t.to_place, st ? H.get(st.hotel_id)?.name : ""]); }
      if (t.direction !== "outbound") { const st = hotelOn(stays, t.profile_id, t.depart_date); rows.push([t.depart_date, t.depart_time, "Departure", p?.last_name, p?.first_name, p?.phone, t.carrier, t.number, t.from_place, t.to_place, st ? H.get(st.hotel_id)?.name : ""]); }
    }
    rows.sort((a, b) => `${a[0]}${a[1]}`.localeCompare(`${b[0]}${b[1]}`)).forEach((r) => ws.addRow(r));
    ws.columns.forEach((col) => { col.width = 15; });
  }
  return xlsx(wb, kind === "rooming" ? "rooming-list" : kind);
}

/** Costs per person, per company and the general summary (finance only). */
async function costsWorkbook() {
  const [{ people }, plan, logi, fd] = await Promise.all([loadCrew("en"), loadPlan(), loadLogistics(), loadFinance()]);
  const costs = people.map((p) => personCost(p, plan, fd, logi.travels, logi.stays)).filter((x) => x.days > 0 || x.total !== 0);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Per person");
  ws.addRow(["Last name", "First name", "Function", "Type", "Paid by", "Paid to", "Mediagest", "Days", "Work days", "Days off", "Standby (per diem only)", "Cachet", "Per diem", "Travel", "Hotel", "Other", "Adjustment", "Total", "Rate missing"]).font = { bold: true };
  for (const x of costs) {
    const p = x.person;
    ws.addRow([p.last_name, p.first_name, p.functionName, p.collaborator_type, x.basis, x.payee, p.in_mediagest ? "Yes" : "No", x.days, x.workDays, x.offDays, x.standbyDays, x.fee, x.perDiem, x.travel, x.hotel, x.other, x.adjustment, x.total, x.missingRate ? "YES" : ""]);
  }
  ws.columns.forEach((col, i) => { col.width = i < 6 ? 18 : 11; if (i >= 11 && i <= 17) col.numFmt = "#,##0.00 €"; });
  const wc = wb.addWorksheet("Companies");
  wc.addRow(["Company", "Concept", "Amount"]).font = { bold: true };
  for (const x of costs.filter((x) => x.basis === "company")) wc.addRow([x.payee, `${x.person.first_name} ${x.person.last_name} (${x.days} days)`, x.fee]);
  for (const s of fd.services) wc.addRow([s.company, s.description ?? "Service", Number(s.amount)]);
  wc.getColumn(3).numFmt = "#,##0.00 €"; wc.columns.forEach((col) => { col.width = 30; });
  const wg = wb.addWorksheet("Summary");
  const tot = (k: "fee" | "perDiem" | "travel" | "hotel" | "other" | "adjustment" | "total") => costs.reduce((s, x) => s + x[k], 0);
  const services = fd.services.reduce((s, x) => s + Number(x.amount), 0);
  const general = fd.other.filter((o) => !o.profile_id).reduce((s, o) => s + Number(o.amount), 0);
  [["Cachets", tot("fee")], ["Per diem", tot("perDiem")], ["Travel", tot("travel")], ["Hotels", tot("hotel")], ["Other (per person)", tot("other") + tot("adjustment")],
   ["Other (general)", general], ["Closed services", services], ["GRAND TOTAL", tot("total") + services + general]].forEach((r) => wg.addRow(r));
  wg.getColumn(2).numFmt = "#,##0.00 €"; wg.getColumn(1).width = 26; wg.getColumn(2).width = 18; wg.lastRow!.font = { bold: true };
  return xlsx(wb, "crew-costs");
}
