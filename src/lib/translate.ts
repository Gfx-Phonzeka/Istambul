import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { createClient } from "@/lib/supabase/server";

export interface TranslateItem { key: string; text: string; html: boolean }

const Output = z.object({ translations: z.array(z.object({ key: z.string(), text: z.string() })) });

const SYSTEM = `You translate content for the private HB Portal of the 4th European Games Istanbul 2027 (Host Broadcaster: Medialuso) from English into Turkish.

Rules:
- Write natural, professional Turkish as used by Turkish broadcasters and sports organisations.
- For items marked html=true: keep every HTML tag, attribute, link and the tag structure exactly as it is; translate only the human-readable text between tags.
- Keep unchanged: the marker [EXEMPLO], brand and organisation names (Medialuso, EBU, EOC, LA28, IBC), codes and formats (1080i50, ISO, OB van, RF), numbers, dates, times, URLs, email addresses and phone numbers.
- Do not add explanations, notes or quotation marks. Return one translation per input item, with the same key.`;

export function translationConfigured() {
  return Boolean(process.env.DEEPL_API_KEY || process.env.ANTHROPIC_API_KEY);
}

// ---------- DeepL (free plan: 500,000 characters per month) ----------
const PROTECTED = ["[EXEMPLO]", "Medialuso", "EBU", "EOC", "LA28", "IBC", "1080i50", "OB van", "ISO"];
const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const unescapeHtml = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");

async function translateWithDeepL(todo: TranslateItem[]): Promise<Record<string, string>> {
  const key = process.env.DEEPL_API_KEY!;
  const endpoint = key.endsWith(":fx") ? "https://api-free.deepl.com/v2/translate" : "https://api.deepl.com/v2/translate";
  // Everything is sent as HTML; protected words are wrapped in <x> tags that DeepL leaves untouched.
  // Only text between tags is touched (never attributes such as links), and only whole words.
  const re = new RegExp(`(?<![A-Za-z0-9])(${PROTECTED.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?![A-Za-z0-9])`, "g");
  const protect = (html: string) => html.split(/(<[^>]+>)/).map((part) => (part.startsWith("<") ? part : part.replace(re, "<x>$1</x>"))).join("");
  const texts = todo.map((i) => protect(i.html ? i.text : escapeHtml(i.text)));
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `DeepL-Auth-Key ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text: texts, source_lang: "EN", target_lang: "TR", tag_handling: "html", ignore_tags: ["x"], formality: "prefer_more" }),
  });
  if (!res.ok) throw new Error(`deepl ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { translations: { text: string }[] };
  const out: Record<string, string> = {};
  todo.forEach((item, i) => {
    const t = (data.translations[i]?.text ?? "").replace(/<\/?x>/g, "");
    out[item.key] = item.html ? t : unescapeHtml(t);
  });
  return out;
}

/** Machine-translates EN → TR (DeepL if configured, otherwise Claude with the portal glossary). */
export async function translateToTurkish(items: TranslateItem[]): Promise<Record<string, string>> {
  const todo = items.filter((i) => i.text.trim() !== "");
  if (!todo.length) return {};
  if (process.env.DEEPL_API_KEY) return translateWithDeepL(todo);
  const supabase = await createClient();
  const { data: glossary } = await supabase.from("glossary_terms").select("term_en,term_tr").eq("status", "published").not("term_tr", "is", null);
  const glossaryText = (glossary ?? []).map((g) => `${g.term_en} → ${g.term_tr}`).join("\n");

  const client = new Anthropic();
  const response = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 32000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(Output) },
    system: [{ type: "text", text: SYSTEM + (glossaryText ? `\n\nPortal glossary (use these Turkish terms):\n${glossaryText}` : ""), cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: JSON.stringify({ items: todo.map(({ key, text, html }) => ({ key, html, text })) }) }],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) throw new Error("translation_failed");
  const out: Record<string, string> = {};
  for (const t of response.parsed_output.translations) if (todo.some((i) => i.key === t.key)) out[t.key] = t.text;
  return out;
}
