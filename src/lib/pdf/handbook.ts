import "server-only";
import { intlLocale, LOCALES } from "@/lib/i18n";
import { EVENT } from "@/lib/event";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { createClient } from "@/lib/supabase/server";
import { loadHandbook, type HbChapter } from "@/lib/handbook";
import { dictionaries, tx, translate, type Locale } from "@/lib/i18n";

export type PdfScope = { kind: "all" } | { kind: "chapter"; id: string } | { kind: "sections"; ids: string[] };

// pdfmake & jsdom are loaded lazily (server only, heavy).
export async function getPrinter() {
  const PdfPrinter = (await import("pdfmake")).default;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const vfs = require("pdfmake/build/vfs_fonts.js") as Record<string, string>;
  const font = (n: string) => Buffer.from(vfs[n], "base64");
  return new PdfPrinter({
    Roboto: {
      normal: font("Roboto-Regular.ttf"),
      bold: font("Roboto-Medium.ttf"),
      italics: font("Roboto-Italic.ttf"),
      bolditalics: font("Roboto-MediumItalic.ttf"),
    },
  });
}

/** Replaces portal image links with embedded data and videos with links, so the PDF is self-contained. */
async function prepareHtml(html: string, supabase: SupabaseClient, videoLabel: string): Promise<string> {
  let out = html.replace(/<div data-youtube-video[^>]*>\s*<iframe[^>]*src="([^"]+)"[^>]*><\/iframe>\s*<\/div>/g, (_m, src) =>
    `<p><i>${videoLabel}: </i><a href="${src}">${src}</a></p>`,
  );
  out = out.replace(/<iframe[^>]*src="([^"]+)"[^>]*><\/iframe>/g, (_m, src) => `<p><i>${videoLabel}: </i><a href="${src}">${src}</a></p>`);
  const imgs = [...out.matchAll(/<img[^>]*src="(\/media\/[^"]+)"[^>]*>/g)];
  for (const m of imgs) {
    const path = decodeURIComponent(m[1].replace(/^\/media\//, ""));
    const { data } = await supabase.storage.from("content-media").download(path);
    if (!data) {
      out = out.replace(m[0], "");
      continue;
    }
    const buf = Buffer.from(await data.arrayBuffer());
    const mime = data.type && data.type.startsWith("image/") ? data.type : "image/png";
    if (!/png|jpe?g/.test(mime)) {
      out = out.replace(m[0], ""); // pdfmake supports PNG and JPEG only
      continue;
    }
    out = out.replace(m[0], `<img src="data:${mime};base64,${buf.toString("base64")}" width="480">`);
  }
  out = out.replace(/<img[^>]*src="https?:[^"]*"[^>]*>/g, ""); // external images are not embedded
  return out;
}

export async function htmlToContent(html: string): Promise<Content> {
  const { JSDOM } = await import("jsdom");
  const htmlToPdfmake = (await import("html-to-pdfmake")).default as (h: string, o: object) => Content;
  const { window } = new JSDOM("");
  return htmlToPdfmake(html, {
    window,
    tableAutoSize: false,
    defaultStyles: {
      h2: { fontSize: 14, bold: true, marginBottom: 4, marginTop: 10 },
      h3: { fontSize: 12, bold: true, marginBottom: 4, marginTop: 8 },
      p: { margin: [0, 3, 0, 6] },
      a: { color: "#0a6b70", decoration: "underline" },
      th: { bold: true, fillColor: "#eceef1" },
      table: { marginBottom: 8 },
    },
  });
}

function filterScope(chapters: HbChapter[], scope: PdfScope): HbChapter[] {
  if (scope.kind === "chapter") return chapters.filter((c) => c.id === scope.id);
  if (scope.kind === "sections") {
    const ids = new Set(scope.ids);
    return chapters.map((c) => ({ ...c, sections: c.sections.filter((s) => ids.has(s.id)) })).filter((c) => c.sections.length > 0);
  }
  return chapters;
}

export async function buildHandbookPdf(
  supabase: SupabaseClient,
  locale: Locale,
  scope: PdfScope,
  opts: { onlyPublicVisibility?: boolean } = {},
): Promise<Buffer> {
  const t = (k: string, v?: Record<string, string | number>) => translate(dictionaries[locale], k, v);
  const chapters = filterScope(await loadHandbook(supabase, { onlyPublicVisibility: opts.onlyPublicVisibility }), scope);
  const generated = new Intl.DateTimeFormat(intlLocale(locale), {
    dateStyle: "long", timeStyle: "short", timeZone: EVENT.tz,
  }).format(new Date());
  const scopeLabel = scope.kind === "all" ? t("handbook.pdfScopeAll") : scope.kind === "chapter" ? t("handbook.pdfScopeChapter") : t("handbook.pdfScopeSections");

  const body: Content[] = [];
  for (const [ci, c] of chapters.entries()) {
    body.push({ text: `${ci + 1}. ${tx(c, "title", locale)}`, style: "chapter", tocItem: true, pageBreak: "before" });
    const summary = tx(c, "summary", locale);
    if (summary) body.push({ text: summary, style: "summary" });
    for (const [si, s] of c.sections.entries()) {
      body.push({ text: `${ci + 1}.${si + 1} ${tx(s, "title", locale)}`, style: "section", tocItem: true, tocMargin: [14, 0, 0, 0] });
      const html = await prepareHtml(tx(s, "body", locale), supabase, t("handbook.video"));
      body.push(await htmlToContent(html));
    }
  }
  if (chapters.length === 0) body.push({ text: t("handbook.empty"), pageBreak: "before" });

  const docTitle = t("handbook.pdfTitle");
  const doc: TDocumentDefinitions = {
    info: { title: `${docTitle} – ${EVENT.name}`, author: "Medialuso – Host Broadcaster", creator: `${EVENT.name} HB Portal` },
    pageSize: "A4",
    pageMargins: [50, 60, 50, 60],
    defaultStyle: { font: "Roboto", fontSize: 10, lineHeight: 1.25, color: "#16202e" },
    styles: {
      coverKicker: { fontSize: 11, color: "#5b6676", characterSpacing: 1 },
      coverTitle: { fontSize: 30, bold: true, color: "#0a6b70", margin: [0, 8, 0, 8] },
      coverSub: { fontSize: 13, color: "#16202e" },
      coverMeta: { fontSize: 9, color: "#5b6676" },
      toc: { fontSize: 18, bold: true, color: "#0a6b70", margin: [0, 0, 0, 12] },
      chapter: { fontSize: 20, bold: true, color: "#0a6b70", margin: [0, 0, 0, 10] },
      summary: { fontSize: 11, italics: true, color: "#5b6676", margin: [0, 0, 0, 12] },
      section: { fontSize: 14, bold: true, color: "#16202e", margin: [0, 14, 0, 6] },
    },
    content: [
      { text: t("common.games").toUpperCase(), style: "coverKicker", margin: [0, 180, 0, 0] },
      { text: docTitle, style: "coverTitle" },
      { text: t("common.hostBroadcaster"), style: "coverSub" },
      { text: `${scopeLabel} · ${locale.toUpperCase()}`, style: "coverSub", margin: [0, 4, 0, 0] },
      { text: t("handbook.pdfGenerated", { date: generated }), style: "coverMeta", margin: [0, 40, 0, 0] },
      { text: t("handbook.pdfConfidential"), style: "coverMeta", margin: [0, 4, 0, 0] },
      { toc: { title: { text: t("handbook.contents"), style: "toc" }, numberStyle: { color: "#5b6676" } }, pageBreak: "before" },
      ...body,
    ],
    header: (page: number) =>
      page === 1 ? null : { text: `${EVENT.name} · ${docTitle}`, fontSize: 8, color: "#5b6676", margin: [50, 30, 50, 0] },
    footer: (page: number, pages: number) =>
      page === 1
        ? null
        : {
            columns: [
              { text: t("common.hostBroadcaster"), fontSize: 8, color: "#5b6676" },
              { text: t("handbook.pageOf", { n: page, total: pages }), alignment: "right", fontSize: 8, color: "#5b6676" },
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

export const FULL_PDF_PATH = (locale: Locale) => `handbook-${locale}.pdf`;

/** Rebuilds the complete handbook PDFs (one per portal language, content visible to all users) and stores them. */
export async function regenerateHandbookPdfs(): Promise<void> {
  const supabase = await createClient();
  for (const locale of LOCALES) {
    const buf = await buildHandbookPdf(supabase, locale, { kind: "all" }, { onlyPublicVisibility: true });
    const { error } = await supabase.storage
      .from("handbook-pdf")
      .upload(FULL_PDF_PATH(locale), buf, { contentType: "application/pdf", upsert: true });
    if (error) throw error;
  }
}
