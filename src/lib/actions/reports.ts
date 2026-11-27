"use server";
import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CHECK_VALUES, PRODUCER_ITEMS, isDay, reportKind, reportsAccess, type ReportFile } from "@/lib/reports";

type Result = { ok: boolean; error?: string };
const UUID = /^[0-9a-f-]{36}$/;
const ownPath = (uid: string, p: unknown) => typeof p === "string" && p.startsWith(`${uid}/`) && p.length < 500 && !p.includes("..");
const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
const optId = (v: unknown) => (typeof v === "string" && UUID.test(v) ? v : null);

export interface DailyReportInput {
  report_date: string; venue_id: string; sport_id: string; sessions: string;
  summary: string; technical_issues: string; editorial_issues: string; attachments: ReportFile[];
  kind?: "producer" | "director"; start_time?: string; end_time?: string; checks?: Record<string, string>; logistics_issues?: string;
}

/** Creates or updates the signed-in producer/director's report for that day. */
export async function saveDailyReport(input: DailyReportInput): Promise<Result> {
  const me = await getProfile();
  if (!me || me.status !== "approved" || !reportsAccess(me).write) return { ok: false, error: "forbidden" };
  if (!isDay(input.report_date)) return { ok: false, error: "date" };
  // Producers file the venue report; admins may file either kind (corrections).
  const kind = me.role === "admin" && (input.kind === "producer" || input.kind === "director") ? input.kind : reportKind(me);
  if (kind === "director" && !clip(input.summary, 10000)) return { ok: false, error: "summary" };
  const checks = kind === "producer"
    ? Object.fromEntries(PRODUCER_ITEMS.map((k) => [k, (CHECK_VALUES as readonly string[]).includes(String(input.checks?.[k])) ? String(input.checks?.[k]) : "ok"]))
    : {};
  const attachments = (Array.isArray(input.attachments) ? input.attachments : [])
    .filter((a) => ownPath(me.id, a?.path))
    .slice(0, 20)
    .map((a) => ({ path: a.path, name: clip(a.name, 200) || "file", size: Number(a.size) || 0 }));
  const row = {
    author_id: me.id, report_date: input.report_date, venue_id: optId(input.venue_id), sport_id: optId(input.sport_id),
    sessions: clip(input.sessions, 500), summary: clip(input.summary, 10000),
    technical_issues: clip(input.technical_issues, 10000), editorial_issues: clip(input.editorial_issues, 10000), attachments,
    kind, checks, start_time: kind === "producer" ? clip(input.start_time, 20) : "", end_time: kind === "producer" ? clip(input.end_time, 20) : "",
    logistics_issues: kind === "producer" ? clip(input.logistics_issues, 10000) : "",
  };
  const supabase = await createClient();
  const { data: existing } = await supabase.from("daily_reports").select("id,attachments").eq("author_id", me.id).eq("report_date", input.report_date).maybeSingle();
  const { error } = existing
    ? await supabase.from("daily_reports").update(row).eq("id", existing.id)
    : await supabase.from("daily_reports").insert(row);
  if (error) return { ok: false, error: "generic" };
  // Files removed from the report are deleted from storage.
  if (existing) {
    const keep = new Set(attachments.map((a) => a.path));
    const gone = ((existing.attachments ?? []) as ReportFile[]).map((a) => a.path).filter((p) => !keep.has(p));
    if (gone.length) await supabase.storage.from("reports").remove(gone);
  }
  revalidatePath("/team/reports");
  return { ok: true };
}

export async function deleteDailyReport(id: string): Promise<Result> {
  const me = await getProfile();
  if (!me || !UUID.test(id)) return { ok: false, error: "forbidden" };
  const supabase = await createClient();
  const { data } = await supabase.from("daily_reports").select("attachments").eq("id", id).maybeSingle();
  const { error } = await supabase.from("daily_reports").delete().eq("id", id);
  if (error) return { ok: false, error: "generic" };
  const paths = ((data?.attachments ?? []) as ReportFile[]).map((a) => a.path);
  if (paths.length) await supabase.storage.from("reports").remove(paths);
  revalidatePath("/team/reports");
  return { ok: true };
}

/** Removes a file uploaded for a form that was then not saved. */
export async function discardReportUpload(path: string): Promise<void> {
  const me = await getProfile();
  if (!me || !ownPath(me.id, path)) return;
  const supabase = await createClient();
  const { count } = await supabase.from("daily_reports").select("id", { count: "exact", head: true }).contains("attachments", [{ path }]);
  if (!count) await supabase.storage.from("reports").remove([path]);
}

export interface PqcInput { report_date: string; venue_id: string; sport_id: string; title: string; url: string; file: ReportFile | null }

export async function addPqcReport(input: PqcInput): Promise<Result> {
  const me = await getProfile();
  if (!me || me.status !== "approved" || !reportsAccess(me).pqc) return { ok: false, error: "forbidden" };
  if (!isDay(input.report_date)) return { ok: false, error: "date" };
  const url = clip(input.url, 1000);
  if (url && !/^https?:\/\/\S+$/.test(url)) return { ok: false, error: "url" };
  const file = input.file && ownPath(me.id, input.file.path) ? input.file : null;
  if (!file && !url) return { ok: false, error: "source" };
  const supabase = await createClient();
  const { error } = await supabase.from("pqc_reports").insert({
    report_date: input.report_date, venue_id: optId(input.venue_id), sport_id: optId(input.sport_id),
    title: clip(input.title, 200) || clip(file?.name, 200) || "PQC report",
    file_path: file?.path ?? null, file_name: file ? clip(file.name, 200) : null, file_size: file ? Number(file.size) || 0 : null,
    url: url || null, uploaded_by: me.id,
  });
  if (error) return { ok: false, error: "generic" };
  revalidatePath("/team/reports");
  return { ok: true };
}

export async function deletePqcReport(id: string): Promise<Result> {
  const me = await getProfile();
  if (!me || !UUID.test(id)) return { ok: false, error: "forbidden" };
  const supabase = await createClient();
  const { data } = await supabase.from("pqc_reports").select("file_path").eq("id", id).maybeSingle();
  const { error, count } = await supabase.from("pqc_reports").delete({ count: "exact" }).eq("id", id);
  if (error || !count) return { ok: false, error: "generic" };
  if (data?.file_path) await supabase.storage.from("reports").remove([data.file_path]);
  revalidatePath("/team/reports");
  return { ok: true };
}
