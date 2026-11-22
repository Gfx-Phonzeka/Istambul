"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { flushEmails } from "@/lib/email";
import { LOCALE_COOKIE, normalizeLocale } from "@/lib/i18n";

export type FormState = { error?: string; errorVars?: Record<string, string | number>; ok?: boolean; field?: string } | undefined;

/** Field (input id) an RPC error belongs to, so it can be shown and focused next to that field. */
const ERROR_FIELD: Record<string, string> = { weak_password: "password", email_exists: "email", invalid_email: "email", terms_required: "terms" };

function safeNext(next: unknown): string {
  const v = typeof next === "string" ? next : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : "/";
}

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const supabase = await createClient();

  const { data: check, error: checkError } = await supabase.rpc("login_precheck", { p_email: email, p_password: password });
  if (checkError) return { error: "auth.errors.generic" };
  const result = check as { status: "ok" | "invalid" | "locked"; until?: string; remaining?: number };
  if (result.status === "locked") {
    const store = await cookies();
    const locale = normalizeLocale(store.get(LOCALE_COOKIE)?.value);
    const time = new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-GB", { timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(result.until!));
    return { error: "auth.locked", errorVars: { time: `${time} (TRT)` } };
  }
  if (result.status === "invalid") {
    const n = result.remaining ?? 0;
    return n <= 3 ? { error: "auth.remaining", errorVars: { n } } : { error: "auth.invalid" };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "auth.invalid", errorVars: { n: 4 } };

  const { data: profile } = await supabase.from("profiles").select("preferred_language,status").eq("email", email).single();
  const store = await cookies();
  if (profile?.preferred_language) {
    store.set(LOCALE_COOKIE, profile.preferred_language, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  if (profile?.status !== "approved") redirect("/account-status");
  redirect(safeNext(form.get("next")));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const get = (k: string) => String(form.get(k) ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (password !== String(form.get("password_confirm") ?? "")) return { error: "auth.errors.password_mismatch", field: "password_confirm" };
  const store = await cookies();
  const lang = normalizeLocale(store.get(LOCALE_COOKIE)?.value);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("register_user", {
    p: {
      email: get("email"),
      password,
      first_name: get("first_name"),
      last_name: get("last_name"),
      organization: get("organization"),
      country: get("country"),
      org_type: get("org_type"),
      job_title: get("job_title"),
      phone: get("phone"),
      terms_accepted: form.get("terms") === "on",
      lang,
    },
  });
  if (error) return { error: "auth.errors.generic" };
  const res = data as { ok: boolean; error?: string };
  if (!res.ok) return { error: `auth.errors.${res.error ?? "generic"}`, field: ERROR_FIELD[res.error ?? ""] };

  await flushEmails();
  // Sign the new user in so they land on the "under review" page.
  await supabase.auth.signInWithPassword({ email: get("email").toLowerCase(), password });
  redirect("/account-status");
}

export async function requestPasswordReset(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await createClient();
  await supabase.rpc("request_password_reset", { p_email: String(form.get("email") ?? "") });
  await flushEmails();
  return { ok: true };
}

export async function completePasswordReset(_: FormState, form: FormData): Promise<FormState> {
  const password = String(form.get("password") ?? "");
  if (password !== String(form.get("password_confirm") ?? "")) return { error: "auth.errors.password_mismatch", field: "password_confirm" };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("complete_password_reset", { p_token: String(form.get("token") ?? ""), p_password: password });
  if (error) return { error: "auth.errors.generic" };
  const res = data as { ok: boolean; error?: string };
  if (!res.ok) return { error: `auth.errors.${res.error ?? "generic"}`, field: ERROR_FIELD[res.error ?? ""] };
  return { ok: true };
}

