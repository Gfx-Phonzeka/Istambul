// Production Guidelines (team only): data loading, reading language and display helpers.
import type { SupabaseClient } from "@supabase/supabase-js";

export type GuideLang = "en" | "pt" | "tr";
export const GUIDE_LANGS: GuideLang[] = ["en", "pt", "tr"];
export const GUIDE_LANG_COOKIE = "guide_lang";

type Tri = { [K in `${"title" | "summary" | "body"}_${GuideLang}`]?: string | null };

export interface GuideSection extends Tri {
  id: string; chapter_id: string; slug: string; position: number; title_en: string; body_en: string;
  visibility: string; status: string; draft: Record<string, unknown> | null; content_updated_at: string | null; tr_reviewed: boolean;
}
export interface GuideChapter extends Tri {
  id: string; slug: string; position: number; title_en: string; visibility: string; status: string;
  draft: Record<string, unknown> | null; tr_reviewed: boolean; sections: GuideSection[];
}

/** The language to read in: the reader's choice, else the portal language. */
export function resolveGuideLang(cookie: string | undefined, uiLocale: "en" | "tr"): GuideLang {
  return cookie === "en" || cookie === "pt" || cookie === "tr" ? cookie : uiLocale;
}

/** Text of a field in the chosen language, falling back to English when that language is empty. */
export function tx(row: Tri & { title_en?: string }, field: "title" | "summary" | "body", lang: GuideLang): string {
  const v = row[`${field}_${lang}`];
  if (v && v.trim() !== "") return v;
  return row[`${field}_en`] ?? "";
}

export async function loadGuide(supabase: SupabaseClient, includeDrafts = false): Promise<GuideChapter[]> {
  let cq = supabase.from("guide_chapters").select("*").order("position").order("title_en");
  let sq = supabase.from("guide_sections").select("*").order("position").order("title_en");
  if (!includeDrafts) { cq = cq.eq("status", "published"); sq = sq.eq("status", "published"); }
  const [{ data: chapters }, { data: sections }] = await Promise.all([cq, sq]);
  return ((chapters ?? []) as GuideChapter[]).map((c) => ({
    ...c, sections: ((sections ?? []) as GuideSection[]).filter((s) => s.chapter_id === c.id),
  }));
}

const TBC = /\[(?:TBC|A CONFIRMAR)(?::\s*([^\]]*))?\]/g;

/** Open points ([TBC: …] / [A CONFIRMAR: …]) found in a text, for the editors' overview. */
export function openPoints(html: string): string[] {
  return [...(html ?? "").matchAll(TBC)].map((m) => (m[1] ?? "").trim());
}

/** Display-time decoration: yellow TBC tags and tick-box checklists. Input is stored, sanitised HTML. */
export function decorateGuideHtml(html: string): string {
  return (html ?? "")
    .replace(TBC, (_m, text: string | undefined) => `<mark class="tbc"><b>TBC</b>${text ? " " + text.trim() : ""}</mark>`)
    .replace(/<ul>(\s*<li>☐)/g, '<ul class="checklist">$1')
    .replace(/<li>☐\s*/g, "<li>");
}

/** Interface labels of the guidelines pages, in the three reading languages. */
export const GUIDE_UI: Record<GuideLang, Record<string, string>> = {
  en: {
    exportAll: "The whole manual", exportChapter: "One chapter", exportSections: "Selected sections", 
    games: "4th European Games · Istanbul 2027", hb: "Medialuso · Host Broadcaster", pdfAll: "Complete manual", pdfChapter: "Chapter", pdfSections: "Selected sections", generated: "Generated on {date}", pageOf: "Page {n} of {total}", pdfConfidential: "Confidential: for the HB production team only.", exportPdf: "Export PDF", exportTitle: "Export the guidelines as PDF", exportWhat: "What to export", exportButton: "Download PDF", exportWorking: "Preparing…", exportLanguage: "The PDF is created in the reading language selected: {lang}.", cancel: "Cancel", langName: "English",
    title: "Production Guidelines", subtitle: "How the Host Broadcaster produces every session. Mandatory for all production and directing teams.",
    contents: "Contents", chapter: "Chapter", previous: "Previous", next: "Next", onThisPage: "On this page", updated: "Updated {date}",
    language: "Reading language", openPoints: "Open points (TBC)", openPointsHelp: "Points still to be confirmed, as marked in the text. Visible to editors and admins only.",
    trReview: "Turkish text to be reviewed by a native speaker", sections: "sections", confidential: "Production team only. Do not share outside the team.",
    tbcNone: "No open points.", backToTeam: "Team area",
  },
  pt: {
    exportAll: "O manual completo", exportChapter: "Um capítulo", exportSections: "Secções escolhidas", 
    games: "4.º Jogos Europeus · Istambul 2027", hb: "Medialuso · Host Broadcaster", pdfAll: "Manual completo", pdfChapter: "Capítulo", pdfSections: "Secções escolhidas", generated: "Gerado a {date}", pageOf: "Página {n} de {total}", pdfConfidential: "Confidencial: só para a equipa de produção do HB.", exportPdf: "Exportar PDF", exportTitle: "Exportar o manual em PDF", exportWhat: "O que exportar", exportButton: "Descarregar PDF", exportWorking: "A preparar…", exportLanguage: "O PDF é criado no idioma de leitura escolhido: {lang}.", cancel: "Cancelar", langName: "Português",
    title: "Manual de Diretrizes de Produção", subtitle: "Como o Host Broadcaster produz cada sessão. Obrigatório para todas as equipas de produção e realização.",
    contents: "Índice", chapter: "Capítulo", previous: "Anterior", next: "Seguinte", onThisPage: "Nesta página", updated: "Atualizado a {date}",
    language: "Idioma de leitura", openPoints: "Pontos em aberto (TBC)", openPointsHelp: "Pontos ainda por confirmar, tal como estão marcados no texto. Só editores e administradores veem esta lista.",
    trReview: "Texto turco a rever por um falante nativo", sections: "secções", confidential: "Só para a equipa de produção. Não partilhar fora da equipa.",
    tbcNone: "Sem pontos em aberto.", backToTeam: "Área da equipa",
  },
  tr: {
    exportAll: "Kılavuzun tamamı", exportChapter: "Bir bölüm", exportSections: "Seçilen kısımlar", 
    games: "4. Avrupa Oyunları · Istanbul 2027", hb: "Medialuso · Ev Sahibi Yayıncı", pdfAll: "Kılavuzun tamamı", pdfChapter: "Bölüm", pdfSections: "Seçilen kısımlar", generated: "Oluşturulma: {date}", pageOf: "Sayfa {n} / {total}", pdfConfidential: "Gizli: yalnızca HB üretim ekibi içindir.", exportPdf: "PDF olarak dışa aktar", exportTitle: "Kılavuzu PDF olarak dışa aktar", exportWhat: "Ne dışa aktarılacak", exportButton: "PDF indir", exportWorking: "Hazırlanıyor…", exportLanguage: "PDF, seçilen okuma dilinde oluşturulur: {lang}.", cancel: "İptal", langName: "Türkçe",
    title: "Üretim Kılavuzu", subtitle: "Ev Sahibi Yayıncı her oturumu nasıl üretir. Tüm üretim ve yönetmenlik ekipleri için zorunludur.",
    contents: "İçindekiler", chapter: "Bölüm", previous: "Önceki", next: "Sonraki", onThisPage: "Bu sayfada", updated: "Güncelleme: {date}",
    language: "Okuma dili", openPoints: "Açık noktalar (TBC)", openPointsHelp: "Metinde işaretlendiği şekliyle henüz teyit edilmemiş noktalar. Yalnızca editörler ve yöneticiler görür.",
    trReview: "Türkçe metin ana dili Türkçe olan biri tarafından gözden geçirilecek", sections: "bölüm", confidential: "Yalnızca üretim ekibi içindir. Ekip dışında paylaşmayın.",
    tbcNone: "Açık nokta yok.", backToTeam: "Ekip alanı",
  },
};
