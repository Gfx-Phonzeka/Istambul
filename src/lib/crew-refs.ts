import { createClient } from "@/lib/supabase/server";
import { tx, cols, DEFAULT_LOCALE } from "@/lib/i18n";
import type { Locale } from "@/lib/event";

/** Venue and sport names, for the Crew Ops plan pages. */
export async function venueSportNames(locale: Locale) {
  const supabase = await createClient();
  const [{ data: venues }, { data: sports }] = await Promise.all([
    supabase.from("venues").select(`id,${cols("title")}` as "*").order(`title_${DEFAULT_LOCALE}`),
    supabase.from("sports").select(`id,${cols("title")}` as "*").order(`title_${DEFAULT_LOCALE}`),
  ]);
  const V = new Map(((venues ?? []) as unknown as { id: string }[]).map((v) => [v.id, tx(v, "title", locale)]));
  const S = new Map(((sports ?? []) as unknown as { id: string }[]).map((s) => [s.id, tx(s, "title", locale)]));
  return { V, S };
}
