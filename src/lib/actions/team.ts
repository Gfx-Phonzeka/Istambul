"use server";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { flushEmails } from "@/lib/email";
import { readTeamFile } from "@/lib/team";

export type TeamImportResult =
  | { ok: true; created: number; updated: number; problems: { line: number; email: string; problem: string }[] }
  | { ok: false; error: string; missing?: string[] };

/** Creates or updates one production-team account per line of the uploaded file. */
export async function importTeam(form: FormData): Promise<TeamImportResult> {
  await requireAdmin();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "no_file" };
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: "too_large" };
  const supabase = await createClient();
  const read = await readTeamFile(supabase, file);
  if ("error" in read) return { ok: false, error: read.error!, missing: "missing" in read ? read.missing : undefined };
  let created = 0, updated = 0;
  const problems: { line: number; email: string; problem: string }[] = [];
  for (const r of read.rows) {
    if (r.problem) { problems.push({ line: r.line, email: r.data.email, problem: r.problem }); continue; }
    const { data, error } = await supabase.rpc("admin_import_team_member", {
      p: { ...r.data, venue_id: r.venue_id ?? "", sport_id: r.sport_id ?? "" },
    });
    const res = data as { ok: boolean; status?: string; error?: string } | null;
    if (error || !res?.ok) { problems.push({ line: r.line, email: r.data.email, problem: res?.error ?? "failed" }); continue; }
    if (res.status === "created") created++; else updated++;
  }
  revalidatePath("/admin/team");
  return { ok: true, created, updated, problems };
}

/** Sends the "choose your password" invitation to the given team members. */
export async function sendTeamInvites(ids: string[]): Promise<{ sent: number; failed: number }> {
  await requireAdmin();
  const supabase = await createClient();
  let sent = 0, failed = 0;
  for (const id of ids.slice(0, 200)) {
    const { error } = await supabase.rpc("admin_send_team_invite", { p_user: id });
    if (error) failed++; else sent++;
  }
  after(flushEmails);
  revalidatePath("/admin/team");
  return { sent, failed };
}
