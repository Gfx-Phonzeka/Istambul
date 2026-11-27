import { createClient } from "@/lib/supabase/server";
import type { Travel } from "@/lib/crew-days";

export interface Hotel { id: string; name: string; address: string | null; city: string | null; phone: string | null; notes: string | null }
export interface Stay { id: string; profile_id: string; hotel_id: string; check_in: string; check_out: string; room_type: string; room_code: string | null; notes: string | null }

/** Travel and hotels. Coordination sees everything; anyone else only their own (database rules). */
export async function loadLogistics() {
  const supabase = await createClient();
  const [{ data: travels }, { data: hotels }, { data: stays }] = await Promise.all([
    supabase.from("crew_travels").select("*").order("depart_date").order("depart_time"),
    supabase.from("crew_hotels").select("*").order("name"),
    supabase.from("crew_stays").select("*").order("check_in"),
  ]);
  return { travels: (travels ?? []) as Travel[], hotels: (hotels ?? []) as Hotel[], stays: (stays ?? []) as Stay[] };
}

export const nights = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000);

/** Hotel where a person sleeps on a given night (check_in ≤ day < check_out), or the last one before. */
export function hotelOn(stays: Stay[], profileId: string, day: string) {
  const mine = stays.filter((s) => s.profile_id === profileId);
  return mine.find((s) => s.check_in <= day && day < s.check_out) ?? mine.find((s) => s.check_out === day) ?? null;
}
