"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { flushEmails } from "@/lib/email";
import { LOCALE_COOKIE, normalizeLocale } from "@/lib/i18n";
import type { FormState } from "./auth";

const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/;

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "auth.errors.generic" };
  const get = (k: string) => String(form.get(k) ?? "").trim().slice(0, 200);
  const required = ["first_name", "last_name", "organization", "country", "job_title", "phone"];
  if (required.some((k) => !get(k))) return { error: "auth.errors.missing_fields" };
  const lang = normalizeLocale(get("preferred_language"));
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: get("first_name"),
      last_name: get("last_name"),
      organization: get("organization"),
      country: get("country"),
      job_title: get("job_title"),
      phone: get("phone"),
      preferred_language: lang,
      notify_email: form.get("notify_email") === "on",
    })
    .eq("id", user.id);
  if (error) return { error: "auth.errors.generic" };
  (await cookies()).set(LOCALE_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  const password = String(form.get("password") ?? "");
  if (password !== String(form.get("password_confirm") ?? "")) return { error: "auth.errors.password_mismatch", field: "new_password_confirm" };
  if (!PASSWORD_RE.test(password)) return { error: "auth.errors.weak_password", field: "new_password" };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "auth.errors.generic" };
  await supabase.rpc("log_password_changed");
  return { ok: true };
}

export async function requestDeletion() {
  const supabase = await createClient();
  await supabase.rpc("request_account_deletion");
  await flushEmails();
  revalidatePath("/profile");
}
