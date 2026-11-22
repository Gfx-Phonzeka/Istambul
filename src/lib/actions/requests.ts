"use server";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { getProfile, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { flushEmails } from "@/lib/email";

export type RequestFormState = { ok?: boolean; reference?: string; error?: string } | undefined;

export async function createRequest(_: RequestFormState, form: FormData): Promise<RequestFormState> {
  const me = await getProfile();
  if (!me || me.status !== "approved") return { error: "requests.errors.generic" };
  const get = (k: string) => String(form.get(k) ?? "").trim();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_service_request", {
    p: {
      request_type: get("request_type"), venue_id: get("venue_id"), sport_id: get("sport_id"), start_date: get("start_date"), end_date: get("end_date"),
      description: get("description"), contact_name: get("contact_name"), contact_email: get("contact_email"), contact_phone: get("contact_phone"),
    },
  });
  if (error) {
    const m = error.message.match(/(invalid_type|description_required|contact_required)/);
    return { error: `requests.errors.${m ? m[1] : "generic"}` };
  }
  after(flushEmails);
  revalidatePath("/requests");
  return { ok: true, reference: String(data) };
}

export async function updateRequestStatus(id: string, status: string, message: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_request", { p_id: id, p_status: status, p_message: message });
  if (!error) { after(flushEmails); revalidatePath("/admin/requests", "layout"); }
  return { ok: !error, error: error?.message };
}

export async function addRequestNote(id: string, body: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_add_request_note", { p_id: id, p_body: body });
  if (!error) revalidatePath(`/admin/requests/${id}`);
  return { ok: !error };
}
