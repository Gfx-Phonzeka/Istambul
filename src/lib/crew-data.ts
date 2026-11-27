import { createClient } from "@/lib/supabase/server";
import { completeness, type CrewRecord } from "@/lib/crew";
import type { Locale } from "@/lib/event";

export interface CrewPerson {
  id: string; first_name: string; last_name: string; email: string; phone: string | null; organization: string | null; country: string | null;
  record: Partial<CrewRecord> | null; pct: number;
  function_id: string | null; functionName: string | null; area: string | null; position_label: string | null;
  collaborator_type: string | null; company: string | null; notes: string | null; in_mediagest: boolean;
  teamIds: string[]; teamNames: string[];
}

/** Everyone in Crew Ops: the production team plus anyone already given a participation. Needs Crew Ops access. */
export async function loadCrew(locale: Locale) {
  const supabase = await createClient();
  const [{ data: profiles }, { data: records }, { data: parts }, { data: functions }, { data: teams }, { data: members }] = await Promise.all([
    supabase.from("profiles").select("id,first_name,last_name,email,phone,organization,country,role").in("role", ["production", "editor", "admin"]).order("last_name"),
    supabase.from("crew_records").select("*"),
    supabase.from("crew_participation").select("*"),
    supabase.from("crew_functions").select("*").order("position"),
    supabase.from("crew_teams").select("*").order("position").order("name"),
    supabase.from("crew_team_members").select("team_id,profile_id"),
  ]);
  const R = new Map((records ?? []).map((r) => [r.profile_id, r as CrewRecord]));
  const P = new Map((parts ?? []).map((p) => [p.profile_id, p]));
  const F = new Map((functions ?? []).map((f) => [f.id, f]));
  const T = new Map((teams ?? []).map((t) => [t.id, t]));
  const fname = (f: Record<string, string> | undefined) => (f ? f[`name_${locale}`] || f.name_en : null);
  const people: CrewPerson[] = (profiles ?? [])
    .filter((p) => p.role === "production" || P.has(p.id))
    .map((p) => {
      const part = P.get(p.id);
      const f = part?.function_id ? F.get(part.function_id) : undefined;
      const teamIds = (members ?? []).filter((m) => m.profile_id === p.id).map((m) => m.team_id);
      const record = R.get(p.id) ?? null;
      return {
        id: p.id, first_name: p.first_name, last_name: p.last_name, email: p.email, phone: p.phone, organization: p.organization, country: p.country,
        record, pct: completeness(record),
        function_id: part?.function_id ?? null, functionName: fname(f), area: f?.area ?? null, position_label: part?.position_label ?? null,
        collaborator_type: part?.collaborator_type ?? null, company: part?.company ?? null, notes: part?.notes ?? null, in_mediagest: Boolean(part?.in_mediagest),
        teamIds, teamNames: teamIds.map((id) => T.get(id)?.name).filter(Boolean) as string[],
      };
    });
  return { people, functions: functions ?? [], teams: teams ?? [], members: members ?? [], fname };
}
