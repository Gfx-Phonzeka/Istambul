// Crew Ops phase D: cost of each person and of the whole crew. Finance only (database rules).
// Rules decided by the project owner (docs/CREW-OPS-DESENHO.md §6):
//  - forfait: the monthly amount is always divided by 30; travel and days off count as normal days;
//  - "standby" days (off between Pan and Parapan, staying at destination by agreement): only per diem;
//  - paid by the day (short productions): days off at half cachet when "off_half" is on;
//  - employees: only per diem; group company employees: rate × days, paid to the company;
//  - closed services (special cameras, RF…): one amount, paid to the company.
import { createClient } from "@/lib/supabase/server";
import type { Plan } from "@/lib/crew-days";
import { personDays } from "@/lib/crew-days";
import type { CrewPerson } from "@/lib/crew-data";
import { nights, type Stay } from "@/lib/crew-logistics";
import type { Travel } from "@/lib/crew-days";

export interface Finance {
  profile_id: string; basis: "daily" | "forfait" | "per_diem_only" | "company"; daily_rate: number | null; monthly_rate: number | null; off_half: boolean;
  per_diem_zone: "intl" | "es" | "pt" | "none" | "custom"; per_diem_custom: number | null; breakfast: boolean; extra_meals: number; adjustment: number; notes: string | null;
}
export type PerDiem = Record<"intl" | "es" | "pt", { meal: number | null; breakfast: number | null; extra: number | null }>;

export async function loadFinance() {
  const supabase = await createClient();
  const [{ data: fin }, { data: settings }, { data: services }, { data: travelCosts }, { data: hotelRates }, { data: other }] = await Promise.all([
    supabase.from("crew_finance").select("*"),
    supabase.from("crew_settings").select("value").eq("key", "per_diem").maybeSingle(),
    supabase.from("crew_services").select("*").order("company"),
    supabase.from("crew_travel_costs").select("*"),
    supabase.from("crew_hotel_rates").select("*"),
    supabase.from("crew_other_costs").select("*").order("created_at"),
  ]);
  const num = (v: unknown) => (v == null ? null : Number(v));
  return {
    finance: new Map(((fin ?? []) as Finance[]).map((f) => [f.profile_id, { ...f, daily_rate: num(f.daily_rate), monthly_rate: num(f.monthly_rate), per_diem_custom: num(f.per_diem_custom), adjustment: Number(f.adjustment ?? 0) }])),
    perDiem: ((settings?.value ?? {}) as PerDiem),
    services: (services ?? []) as { id: string; company: string; description: string | null; amount: number; notes: string | null }[],
    travelCosts: new Map(((travelCosts ?? []) as { travel_id: string; amount: number }[]).map((t) => [t.travel_id, Number(t.amount)])),
    hotelRates: new Map(((hotelRates ?? []) as { hotel_id: string; room_type: string; night_rate: number }[]).map((r) => [`${r.hotel_id}|${r.room_type}`, Number(r.night_rate)])),
    other: (other ?? []) as { id: string; category: string; profile_id: string | null; description: string | null; amount: number }[],
  };
}
export type FinanceData = Awaited<ReturnType<typeof loadFinance>>;

/** Default basis when finance has not set one yet, from the collaborator type. */
export const defaultBasis = (p: CrewPerson): Finance["basis"] =>
  p.collaborator_type === "employee" ? "per_diem_only" : p.collaborator_type === "group_company" ? "company" : "daily";

export interface PersonCost {
  person: CrewPerson; basis: Finance["basis"]; days: number; workDays: number; offDays: number; standbyDays: number;
  fee: number; perDiem: number; travel: number; hotel: number; other: number; adjustment: number; total: number; payee: string; missingRate: boolean;
}

export function personCost(p: CrewPerson, plan: Plan, fd: FinanceData, travels: Travel[], stays: Stay[]): PersonCost {
  const f = fd.finance.get(p.id);
  const basis = f?.basis ?? defaultBasis(p);
  const days = [...personDays(plan, p.id).values()];
  const standbyDays = days.filter((d) => d.type === "standby").length;
  const offDays = days.filter((d) => d.type === "off").length;
  const workDays = days.length - standbyDays - offDays;
  const paidDays = days.length - standbyDays;
  let fee = 0; let missingRate = false;
  if (basis === "forfait") { if (f?.monthly_rate == null) missingRate = true; else fee = (f.monthly_rate / 30) * paidDays; }
  else if (basis === "daily" || basis === "company") {
    if (f?.daily_rate == null) missingRate = true;
    else fee = f.daily_rate * workDays + f.daily_rate * offDays * (f.off_half ? 0.5 : 1);
  }
  // Per diem: every day away (travel, work, off and standby).
  const zone = f?.per_diem_zone ?? "intl";
  let perDay = 0; let extra = 0;
  if (zone === "custom") perDay = f?.per_diem_custom ?? 0;
  else if (zone !== "none") {
    const z = fd.perDiem[zone] ?? { meal: null, breakfast: null, extra: null };
    if (z.meal == null) missingRate = true;
    perDay = (z.meal ?? 0) * 2 + ((f?.breakfast ?? true) ? z.breakfast ?? 0 : 0);
    extra = (z.extra ?? 0) * (f?.extra_meals ?? 0);
  }
  const perDiem = perDay * days.length + extra;
  const travel = travels.filter((t) => t.profile_id === p.id).reduce((s, t) => s + (fd.travelCosts.get(t.id) ?? 0), 0);
  // Hotel: nights × rate of the room; a shared room (same code) is split between the people in it.
  const hotel = stays.filter((s) => s.profile_id === p.id).reduce((sum, s) => {
    const rate = fd.hotelRates.get(`${s.hotel_id}|${s.room_type}`) ?? 0;
    const share = s.room_code ? Math.max(1, stays.filter((x) => x.hotel_id === s.hotel_id && x.room_code === s.room_code && x.check_in < s.check_out && s.check_in < x.check_out).length) : 1;
    return sum + (rate * nights(s.check_in, s.check_out)) / share;
  }, 0);
  const other = fd.other.filter((o) => o.profile_id === p.id).reduce((s, o) => s + Number(o.amount), 0);
  const adjustment = f?.adjustment ?? 0;
  const r2 = (n: number) => Math.round(n * 100) / 100;
  return {
    person: p, basis, days: days.length, workDays, offDays, standbyDays,
    fee: r2(fee), perDiem: r2(perDiem), travel: r2(travel), hotel: r2(hotel), other: r2(other), adjustment: r2(adjustment),
    total: r2(fee + perDiem + travel + hotel + other + adjustment), payee: basis === "company" ? p.company || "—" : `${p.first_name} ${p.last_name}`, missingRate,
  };
}
