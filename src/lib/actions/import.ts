"use server";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildPreview, readFile, DATASETS, type Dataset, type ImportPreview } from "@/lib/import";

export type PreviewResult = { ok: true; preview: ImportPreview } | { ok: false; error: string };

async function load(form: FormData) {
  await requireStaff();
  const dataset = String(form.get("dataset")) as Dataset;
  const file = form.get("file");
  if (!DATASETS.includes(dataset)) return { error: "invalid" } as const;
  if (!(file instanceof File) || file.size === 0) return { error: "no_file" } as const;
  if (file.size > 10 * 1024 * 1024) return { error: "too_large" } as const;
  const parsed = await readFile(dataset, file);
  if (parsed.error) return { error: parsed.error } as const;
  const supabase = await createClient();
  const built = await buildPreview(supabase, dataset, parsed.rows);
  return { dataset, supabase, ...built } as const;
}

export async function previewImport(form: FormData): Promise<PreviewResult> {
  const r = await load(form);
  if ("error" in r) return { ok: false, error: r.error! };
  return { ok: true, preview: r.preview };
}

/** Re-reads the same file (never trusts data from the browser) and applies it in one transaction. */
export async function applyImport(form: FormData): Promise<{ ok: true; result: { inserted: number; updated: number; deleted: number } } | { ok: false; error: string }> {
  const r = await load(form);
  if ("error" in r) return { ok: false, error: r.error! };
  if (r.preview.errors.length) return { ok: false, error: "has_errors" };
  const { data, error } = await r.supabase.rpc("apply_import", { p_dataset: r.dataset, p_rows: r.rows, p_delete_missing: form.get("deleteMissing") === "on" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true, result: data as { inserted: number; updated: number; deleted: number } };
}
