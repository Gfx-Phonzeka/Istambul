import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { getPrinter, htmlToContent } from "@/lib/pdf/handbook";
import { GUIDE_UI, loadGuide, tx, type GuideChapter, type GuideLang } from "@/lib/guide";

export type GuidePdfScope = { kind: "all" } | { kind: "chapter"; id: string } | { kind: "sections"; ids: string[] };

const TBC = /\[(?:TBC|A CONFIRMAR)(?::\s*([^\]]*))?\]/g;
const LOCALE: Record<GuideLang, string> = { en: "en-GB", pt: "pt-PT", tr: "tr-TR" };

function filterScope(chapters: GuideChapter[], scope: GuidePdfScope) {
  if (scope.kind === "chapter") return chapters.filter((c) => c.id === scope.id);
  if (scope.kind === "sections") {
    const ids = new Set(scope.ids);
    return chapters.map((c) => ({ ...c, sections: c.sections.filter((s) => ids.has(s.id)) })).filter((c) => c.sections.length > 0);
  }
  return chapters;
}

const plain = (h: string) => h.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();

/** One tick box per checklist item (drawn, so it does not depend on the font). */
function checklist(items: string[]): Content {
  return {
    stack: items.map((text) => ({
      columns: [
        { width: 18, canvas: [{ type: "rect", x: 0, y: 2, w: 10, h: 10, r: 1.5, lineWidth: 1, lineColor: "#16202e" }] },
        { width: "*", text },
      ],
      margin: [0, 3, 0, 5],
    })),
    margin: [0, 4, 0, 8],
  } as Content;
}

/** Converts a section body: checklists become tick boxes; TBC points are highlighted; portal links become absolute. */
async function bodyToContent(html: string, origin: string): Promise<Content[]> {
  const prepared = (html ?? "")
    .replace(/href="\//g, `href="${origin}/`)
    .replace(/<(td|th)([^>]*)>\s*<\/\1>/g, "<$1$2>&nbsp;</$1>") // empty cells break the PDF table layout
    .replace(/<td>([\s\S]*?)<\/td>/g, (_m, c: string) => `<td>${c.replace(/<a [^>]*>([\s\S]*?)<\/a>/g, "$1")}</td>`) // links inside cells break it too
    .replace(TBC, (_m, text: string | undefined) => `<b style="background-color:#fbe3a0"> TBC ${text ? text.trim() + " " : ""}</b>`);
  const out: Content[] = [];
  let rest = prepared;
  const re = /<ul>\s*(<li>☐[\s\S]*?)<\/ul>/;
  for (let m = rest.match(re); m; m = rest.match(re)) {
    const before = rest.slice(0, m.index);
    if (before.trim()) out.push(await htmlToContent(before));
    const items = [...m[1].matchAll(/<li>☐\s*([\s\S]*?)<\/li>/g)].map((x) => plain(x[1]));
    out.push(checklist(items));
    rest = rest.slice((m.index ?? 0) + m[0].length);
  }
  if (rest.trim()) out.push(await htmlToContent(rest));
  return out;
}

export async function buildGuidePdf(supabase: SupabaseClient, lang: GuideLang, scope: GuidePdfScope, origin: string): Promise<Buffer> {
  const L = GUIDE_UI[lang];
  const f = (k: string, v: Record<string, string | number> = {}) => Object.entries(v).reduce((s, [a, b]) => s.replaceAll(`{${a}}`, String(b)), L[k] ?? k);
  const all = await loadGuide(supabase);
  const chapters = filterScope(all, scope);
  const generated = new Intl.DateTimeFormat(LOCALE[lang], { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date());
  const scopeLabel = scope.kind === "all" ? L.pdfAll : scope.kind === "chapter" ? L.pdfChapter : L.pdfSections;

  const body: Content[] = [];
  for (const c of chapters) {
    const ci = all.findIndex((x) => x.id === c.id);
    const full = all[ci];
    body.push({ text: `${ci + 1}. ${tx(c, "title", lang)}`, style: "chapter", tocItem: true, pageBreak: "before" });
    const summary = tx(c, "summary", lang);
    if (summary) body.push({ text: summary.replace(/\n\n/g, "\n"), style: "summary" });
    for (const [n, s] of c.sections.entries()) {
      const si = full.sections.findIndex((x) => x.id === s.id);
      // Checklists (chapter "checklists") take one page each, so they can be printed and used at the venue.
      const ownPage = c.slug === "checklists" && n > 0;
      body.push({ text: `${ci + 1}.${si + 1} ${tx(s, "title", lang)}`, style: "section", tocItem: true, tocMargin: [14, 0, 0, 0], ...(ownPage ? { pageBreak: "before" as const } : {}) });
      body.push(...(await bodyToContent(tx(s, "body", lang), origin)));
    }
  }

  const doc: TDocumentDefinitions = {
    info: { title: `${L.title} – Istanbul 2027`, author: "Medialuso – Host Broadcaster", creator: "Istanbul 2027 HB Portal" },
    pageSize: "A4",
    pageMargins: [50, 60, 50, 60],
    defaultStyle: { font: "Roboto", fontSize: 10, lineHeight: 1.25, color: "#16202e" },
    styles: {
      coverKicker: { fontSize: 11, color: "#5b6676", characterSpacing: 1 },
      coverTitle: { fontSize: 28, bold: true, color: "#0a6b70", margin: [0, 8, 0, 8] },
      coverSub: { fontSize: 13, color: "#16202e" },
      coverMeta: { fontSize: 9, color: "#5b6676" },
      toc: { fontSize: 18, bold: true, color: "#0a6b70", margin: [0, 0, 0, 12] },
      chapter: { fontSize: 20, bold: true, color: "#0a6b70", margin: [0, 0, 0, 10] },
      summary: { fontSize: 11, italics: true, color: "#5b6676", margin: [0, 0, 0, 12] },
      section: { fontSize: 14, bold: true, color: "#16202e", margin: [0, 14, 0, 6] },
    },
    content: [
      { text: L.games.toUpperCase(), style: "coverKicker", margin: [0, 180, 0, 0] },
      { text: L.title, style: "coverTitle" },
      { text: L.hb, style: "coverSub" },
      { text: `${scopeLabel} · ${lang.toUpperCase()}`, style: "coverSub", margin: [0, 4, 0, 0] },
      { text: f("generated", { date: generated }), style: "coverMeta", margin: [0, 40, 0, 0] },
      { text: L.pdfConfidential, style: "coverMeta", bold: true, margin: [0, 4, 0, 0] },
      { toc: { title: { text: L.contents, style: "toc" }, numberStyle: { color: "#5b6676" } }, pageBreak: "before" },
      ...body,
    ],
    header: (page: number) => (page === 1 ? null : { text: `Istanbul 2027 · ${L.title} · ${L.pdfConfidential}`, fontSize: 8, color: "#5b6676", margin: [50, 30, 50, 0] }),
    footer: (page: number, pages: number) =>
      page === 1 ? null : {
        columns: [
          { text: L.hb, fontSize: 8, color: "#5b6676" },
          { text: f("pageOf", { n: page, total: pages }), alignment: "right", fontSize: 8, color: "#5b6676" },
        ],
        margin: [50, 20, 50, 0],
      },
  };

  const printer = await getPrinter();
  const pdf = printer.createPdfKitDocument(doc);
  const chunks: Buffer[] = [];
  return await new Promise<Buffer>((resolve, reject) => {
    pdf.on("data", (c: Buffer) => chunks.push(c));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);
    pdf.end();
  });
}
