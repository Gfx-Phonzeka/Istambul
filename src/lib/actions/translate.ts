"use server";
import { requireStaff } from "@/lib/auth";
import { translateToTurkish, translationConfigured, type TranslateItem } from "@/lib/translate";
import { sanitizeRichText } from "@/lib/content/sanitize";

export type TranslateResult = { ok: true; translations: Record<string, string> } | { ok: false; error: "not_configured" | "too_long" | "failed" };

export async function translateFields(items: TranslateItem[]): Promise<TranslateResult> {
  await requireStaff();
  if (!translationConfigured()) return { ok: false, error: "not_configured" };
  const clean = items.filter((i) => typeof i?.key === "string" && typeof i?.text === "string").slice(0, 200);
  if (clean.reduce((n, i) => n + i.text.length, 0) > 150_000) return { ok: false, error: "too_long" };
  try {
    const t = await translateToTurkish(clean);
    // Rich text coming back from the model is sanitised like anything typed in the editor.
    for (const i of clean) if (i.html && t[i.key]) t[i.key] = sanitizeRichText(t[i.key]);
    return { ok: true, translations: t };
  } catch (e) {
    console.error("translation error", e);
    return { ok: false, error: "failed" };
  }
}
