"use server";
import { EVENT } from "@/lib/event";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { flushEmails } from "@/lib/email";
import { requireAdmin } from "@/lib/auth";

type Result = { ok: boolean; error?: string };

async function run(fn: string, args: Record<string, unknown>, sendEmails = false): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, args);
  if (error) return { ok: false, error: error.message };
  if (sendEmails) await flushEmails();
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function reviewUser(userId: string, decision: "approve" | "reject", role: string | null, reason: string) {
  return run("admin_review_user", { p_user: userId, p_decision: decision, p_role: role, p_reason: reason }, true);
}
export async function setUserRole(userId: string, role: string) {
  return run("admin_set_user_role", { p_user: userId, p_role: role });
}
export async function setUserStatus(userId: string, status: "approved" | "suspended") {
  return run("admin_set_user_status", { p_user: userId, p_status: status });
}
export async function setUserPassword(userId: string, password: string) {
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/.test(password)) return { ok: false, error: "weak_password" };
  return run("admin_set_user_password", { p_user: userId, p_password: password });
}
export async function deleteUser(userId: string) {
  return run("admin_delete_user", { p_user: userId });
}

const CEREMONIES = { opening_ceremony: "Opening Ceremony", closing_ceremony: "Closing Ceremony" } as const;

/** Saves the date and labels of the opening or closing ceremony (dashboard countdown). */
export async function saveCeremony(form: FormData) {
  await requireAdmin();
  const key = String(form.get("key") ?? "") as keyof typeof CEREMONIES;
  if (!(key in CEREMONIES)) return;
  const local = String(form.get("at") ?? ""); // "YYYY-MM-DDTHH:mm" in Istanbul time
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return;
  const supabase = await createClient();
  await supabase.from("settings").upsert({
    key,
    value: {
      at: `${local}:00${EVENT.utcOffset}`,
      ...Object.fromEntries(EVENT.locales.map((l) => [`label_${l}`, String(form.get(`label_${l}`) ?? "").trim()])),
      ...(String(form.get(`label_${EVENT.locales[0]}`) ?? "").trim() ? {} : { [`label_${EVENT.locales[0]}`]: CEREMONIES[key] }),
    },
    updated_at: new Date().toISOString(),
  });
  revalidatePath("/", "layout");
}

/** Retries emails still queued (e.g. after configuring the email provider). */
export async function retryEmails() {
  await requireAdmin();
  await flushEmails();
  revalidatePath("/admin/emails");
}
