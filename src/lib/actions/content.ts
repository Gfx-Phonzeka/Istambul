"use server";
import { EVENT } from "@/lib/event";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CONTENT_TYPES, columnsOf, fieldLangs, isContentType, primaryLang, type ContentType } from "@/lib/content/registry";
import { sanitizeRichText } from "@/lib/content/sanitize";
import { regenerateHandbookPdfs } from "@/lib/pdf/handbook";
import { flushEmails } from "@/lib/email";

export type SaveResult = { ok: true; id: string } | { ok: false; error: string; field?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Validates and normalises raw form values into database columns. */
function parseValues(type: ContentType, raw: Record<string, unknown>): { values: Record<string, unknown> } | { error: string; field: string } {
  const values: Record<string, unknown> = {};
  for (const f of type.fields) {
    const langs = fieldLangs(f)?.map((l) => `_${l}`) ?? [""];
    const main = `_${primaryLang(f)}`;
    for (const suffix of langs) {
      const col = f.name + suffix;
      const v = raw[col];
      let s = typeof v === "string" ? v.trim() : v == null ? "" : String(v);
      const required = f.required && (suffix === "" || suffix === main);
      if (f.kind === "richtext") {
        s = sanitizeRichText(s);
        if (s.replace(/<[^>]+>/g, "").trim() === "" && !s.includes("<img") && !s.includes("<iframe")) s = "";
      }
      if (f.kind === "boolean") { values[col] = s === "true" || s === "on"; continue; }
      if (required && s === "") return { error: "cms.errors.required", field: col };
      if (s === "") {
        values[col] = (suffix !== "" && suffix !== main) || !required ? null : "";
        if (f.kind === "number") values[col] = 0;
        continue;
      }
      switch (f.kind) {
        case "number": {
          const n = Number.parseInt(s, 10);
          if (!Number.isFinite(n)) return { error: "cms.errors.number", field: col };
          values[col] = n;
          break;
        }
        case "date":
          if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return { error: "cms.errors.date", field: col };
          values[col] = s;
          break;
        case "datetime":
          if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) return { error: "cms.errors.date", field: col };
          values[col] = `${s}:00${EVENT.utcOffset}`; // entered in Istanbul time
          break;
        case "slug":
          if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s)) return { error: "cms.errors.slug", field: col };
          values[col] = s;
          break;
        case "email":
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)) return { error: "cms.errors.email", field: col };
          values[col] = s;
          break;
        case "reference":
          if (!UUID.test(s)) return { error: "cms.errors.required", field: col };
          values[col] = s;
          break;
        case "select":
          if (!f.options?.some((o) => o.value === s) && !(f.name === "field_shape" && s.startsWith("svg:"))) return { error: "cms.errors.required", field: col };
          values[col] = s;
          break;
        default:
          values[col] = s.slice(0, f.kind === "richtext" ? 500_000 : 5000);
      }
    }
  }
  if (typeof values.start_at === "string" && typeof values.end_at === "string" && new Date(values.end_at) < new Date(values.start_at)) {
    return { error: "cms.errors.endBeforeStart", field: "end_at" };
  }
  return { values };
}

function revalidate(type: ContentType) {
  revalidatePath("/", "layout");
  void type;
}

function afterPublish(type: ContentType) {
  after(flushEmails); // notifications created by database triggers (urgent notices, followed items)
  if (type.key === "handbook_chapter" || type.key === "handbook_section") {
    after(async () => {
      try {
        await regenerateHandbookPdfs();
      } catch (e) {
        console.error("handbook pdf regeneration failed", e);
      }
    });
  }
}

export async function saveContent(typeKey: string, id: string | null, raw: Record<string, unknown>): Promise<SaveResult> {
  await requireStaff();
  if (!isContentType(typeKey)) return { ok: false, error: "cms.errors.generic" };
  const type = CONTENT_TYPES[typeKey];
  const parsed = parseValues(type, raw);
  if ("error" in parsed) return { ok: false, error: parsed.error, field: parsed.field };
  const supabase = await createClient();

  if (!id) {
    const { data, error } = await supabase.from(type.table).insert({ ...parsed.values, status: "draft" }).select("id").single();
    if (error) return { ok: false, error: error.code === "23505" ? "cms.errors.duplicate" : "cms.errors.generic" };
    revalidate(type);
    return { ok: true, id: data.id };
  }

  const { data: current } = await supabase.from(type.table).select("status").eq("id", id).single();
  if (!current) return { ok: false, error: "cms.errors.generic" };
  // Published items keep their live version; edits wait in "draft" until published.
  const update = current.status === "published" ? { draft: parsed.values } : { ...parsed.values, draft: null };
  const { error } = await supabase.from(type.table).update(update).eq("id", id);
  if (error) return { ok: false, error: error.code === "23505" ? "cms.errors.duplicate" : "cms.errors.generic" };
  revalidate(type);
  after(flushEmails);
  return { ok: true, id };
}

export async function publishContent(typeKey: string, id: string): Promise<SaveResult> {
  await requireStaff();
  if (!isContentType(typeKey)) return { ok: false, error: "cms.errors.generic" };
  const type = CONTENT_TYPES[typeKey];
  const supabase = await createClient();
  const { data: row } = await supabase.from(type.table).select("*").eq("id", id).single();
  if (!row) return { ok: false, error: "cms.errors.generic" };
  const pending = (row.draft ?? {}) as Record<string, unknown>;
  const allowed = new Set(columnsOf(type));
  const live = Object.fromEntries(Object.entries(pending).filter(([k]) => allowed.has(k)));
  const now = new Date().toISOString();
  const { error } = await supabase
    .from(type.table)
    .update({ ...live, draft: null, status: "published", published_at: row.published_at ?? now, content_updated_at: now })
    .eq("id", id);
  if (error) return { ok: false, error: error.code === "23505" ? "cms.errors.duplicate" : "cms.errors.generic" };
  revalidate(type);
  afterPublish(type);
  return { ok: true, id };
}

export async function unpublishContent(typeKey: string, id: string): Promise<SaveResult> {
  await requireStaff();
  if (!isContentType(typeKey)) return { ok: false, error: "cms.errors.generic" };
  const type = CONTENT_TYPES[typeKey];
  const supabase = await createClient();
  const { data: row } = await supabase.from(type.table).select("draft").eq("id", id).single();
  const pending = (row?.draft ?? {}) as Record<string, unknown>;
  const allowed = new Set(columnsOf(type));
  const live = Object.fromEntries(Object.entries(pending).filter(([k]) => allowed.has(k)));
  const { error } = await supabase.from(type.table).update({ ...live, draft: null, status: "draft" }).eq("id", id);
  if (error) return { ok: false, error: "cms.errors.generic" };
  revalidate(type);
  afterPublish(type);
  return { ok: true, id };
}

export async function discardDraft(typeKey: string, id: string): Promise<SaveResult> {
  await requireStaff();
  if (!isContentType(typeKey)) return { ok: false, error: "cms.errors.generic" };
  const supabase = await createClient();
  const { error } = await supabase.from(CONTENT_TYPES[typeKey].table).update({ draft: null }).eq("id", id);
  if (error) return { ok: false, error: "cms.errors.generic" };
  return { ok: true, id };
}

export async function deleteContent(typeKey: string, id: string): Promise<SaveResult> {
  await requireStaff();
  if (!isContentType(typeKey)) return { ok: false, error: "cms.errors.generic" };
  const type = CONTENT_TYPES[typeKey];
  const supabase = await createClient();
  const { error } = await supabase.from(type.table).delete().eq("id", id);
  if (error) return { ok: false, error: "cms.errors.generic" };
  revalidate(type);
  afterPublish(type);
  return { ok: true, id };
}

export async function regeneratePdfsNow(): Promise<SaveResult> {
  await requireStaff();
  try {
    await regenerateHandbookPdfs();
    return { ok: true, id: "" };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "cms.errors.generic" };
  }
}
