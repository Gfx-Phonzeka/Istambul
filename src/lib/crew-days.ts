// Crew Ops phase B: each person's days come from the teams they belong to (team → unit, by dates → the unit's daily plan),
// then manual exceptions are laid on top (travel, day off, another unit, or "none" to remove a generated day).
import { createClient } from "@/lib/supabase/server";

export const DAY_TYPES = ["travel", "setup", "rehearsal", "check", "live", "off", "dismantle", "office"] as const;
export type DayType = (typeof DAY_TYPES)[number];
/** Short codes as in the crew control sheets. */
export const DAY_CODE: Record<DayType, string> = {
  travel: "FLY", setup: "SET UP", rehearsal: "REH", check: "CHECK", live: "MD", off: "OFF", dismantle: "DISM", office: "IBC",
};

export interface Unit { id: string; code: string; name: string | null; size: string | null; mode: string | null; cameras: number | null; notes: string | null; position: number }
export interface UnitDay { unit_id: string; day: string; day_type: DayType; venue_id: string | null; sport_id: string | null; call_time: string | null; notes: string | null }
export interface Assignment { id: string; team_id: string; unit_id: string; start_date: string; end_date: string; notes: string | null }
export interface PersonDayRow { profile_id: string; day: string; day_type: DayType | "none" | null; unit_id: string | null; notes: string | null }
export interface PersonDay { day: string; type: DayType; unitId: string | null; venueId: string | null; sportId: string | null; call: string | null; manual: boolean; note: string | null }

export const eachDay = (from: string, to: string) => {
  const out: string[] = [];
  const d = new Date(`${from}T12:00:00Z`);
  const end = new Date(`${to}T12:00:00Z`);
  for (let i = 0; d <= end && i < 400; i++) { out.push(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() + 1); }
  return out;
};

export async function loadPlan() {
  const supabase = await createClient();
  const [{ data: units }, { data: unitDays }, { data: assignments }, { data: members }, { data: personDays }] = await Promise.all([
    supabase.from("crew_units").select("*").order("position").order("code"),
    supabase.from("crew_unit_days").select("*").order("day"),
    supabase.from("crew_assignments").select("*").order("start_date"),
    supabase.from("crew_team_members").select("team_id,profile_id"),
    supabase.from("crew_person_days").select("profile_id,day,day_type,unit_id,notes"),
  ]);
  return {
    units: (units ?? []) as Unit[], unitDays: (unitDays ?? []) as UnitDay[], assignments: (assignments ?? []) as Assignment[],
    members: (members ?? []) as { team_id: string; profile_id: string }[], personDays: (personDays ?? []) as PersonDayRow[],
  };
}
export type Plan = Awaited<ReturnType<typeof loadPlan>>;

/** All the days of one person, by date. */
export function personDays(plan: Plan, profileId: string): Map<string, PersonDay> {
  const out = new Map<string, PersonDay>();
  const UD = new Map(plan.unitDays.map((u) => [`${u.unit_id}|${u.day}`, u]));
  const teams = new Set(plan.members.filter((m) => m.profile_id === profileId).map((m) => m.team_id));
  for (const a of plan.assignments.filter((x) => teams.has(x.team_id))) {
    for (const day of eachDay(a.start_date, a.end_date)) {
      const u = UD.get(`${a.unit_id}|${day}`);
      if (!u) continue;
      out.set(day, { day, type: u.day_type, unitId: u.unit_id, venueId: u.venue_id, sportId: u.sport_id, call: u.call_time, manual: false, note: u.notes });
    }
  }
  for (const o of plan.personDays.filter((x) => x.profile_id === profileId)) {
    if (!o.day_type || o.day_type === "none") { out.delete(o.day); continue; }
    const base = out.get(o.day);
    const u = o.unit_id ? UD.get(`${o.unit_id}|${o.day}`) : undefined;
    out.set(o.day, {
      day: o.day, type: o.day_type, unitId: o.unit_id ?? base?.unitId ?? null,
      venueId: u?.venue_id ?? (o.unit_id ? null : base?.venueId ?? null), sportId: u?.sport_id ?? (o.unit_id ? null : base?.sportId ?? null),
      call: u?.call_time ?? (o.unit_id ? null : base?.call ?? null), manual: true, note: o.notes,
    });
  }
  return new Map([...out.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

/** First and last day of the whole plan (units and exceptions). */
export function planRange(plan: Plan): [string, string] | null {
  const all = [...plan.unitDays.map((d) => d.day), ...plan.personDays.map((d) => d.day), ...plan.assignments.flatMap((a) => [a.start_date, a.end_date])].sort();
  return all.length ? [all[0], all[all.length - 1]] : null;
}
