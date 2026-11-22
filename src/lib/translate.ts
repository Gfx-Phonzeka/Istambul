import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { createClient } from "@/lib/supabase/server";

export interface TranslateItem { key: string; text: string; html: boolean }

const Output = z.object({ translations: z.array(z.object({ key: z.string(), text: z.string() })) });

const SYSTEM = `You translate content for the private Right Holders portal of the 4th European Games Istanbul 2027 (Host Broadcaster: Medialuso) from English into Turkish.

Rules:
- Write natural, professional Turkish as used by Turkish broadcasters and sports organisations.
- For items marked html=true: keep every HTML tag, attribute, link and the tag structure exactly as it is; translate only the human-readable text between tags.
- Keep unchanged: the marker [EXEMPLO], brand and organisation names (Medialuso, EBU, EOC, LA28, IBC), codes and formats (1080i50, ISO, OB van, RF), numbers, dates, times, URLs, email addresses and phone numbers.
- Do not add explanations, notes or quotation marks. Return one translation per input item, with the same key.`;

export function translationConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Machine-translates EN → TR. Uses the published glossary so terminology stays consistent. */
export async function translateToTurkish(items: TranslateItem[]): Promise<Record<string, string>> {
  const todo = items.filter((i) => i.text.trim() !== "");
  if (!todo.length) return {};
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
