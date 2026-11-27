import { cache } from "react";
import { redirect } from "next/navigation";
import { requireApproved, type Profile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** True for admins and the people given Crew Ops access (coordination or finance). */
export const isCrewCoord = cache(async (): Promise<boolean> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_crew_coord");
  return data === true;
});

export async function requireCrew(): Promise<Profile> {
  const profile = await requireApproved();
  if (!(await isCrewCoord())) redirect("/");
  return profile;
}

/** Signed link (5 minutes) to an accreditation photo; storage rules decide who may see it. */
export async function crewPhotoUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage.from("crew-photos").createSignedUrl(path, 300);
  return data?.signedUrl ?? null;
}
