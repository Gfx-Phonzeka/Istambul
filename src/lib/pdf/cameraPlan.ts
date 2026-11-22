import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { createElement } from "react";
import { dictionaries, pick, translate, type Locale } from "@/lib/i18n";
import { loadPlans } from "@/lib/venues";
import { StaticCameraMap } from "@/components/venues/cameraMapStatic";

async function printer() {
  const PdfPrinter = (await import("pdfmake")).default;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const vfs = require("pdfmake/build/vfs_fonts.js") as Record<string, string>;
  const f = (n: string) => Buffer.from(vfs[n], "base64");
  return new PdfPrinter({ Roboto: { normal: f("Roboto-Regular.ttf"), bold: f("Roboto-Medium.ttf"), italics: f("Roboto-Italic.ttf"), bolditalics: f("Roboto-MediumItalic.ttf") } });
}

/**
 * PDF of one camera map: conceptual map + camera table, followed by the pages of the architecture drawing.
 * Returns null when the plan is not visible to the user.
 */
export async function buildCameraPlanPdf(supabase: SupabaseClient, planId: string, locale: Locale): Promise<{ pdf: Uint8Array; name: string } | null> {
  const t = (k: string, v?: Record<string, string | number>) => translate(dictionaries[locale], k, v);
  const plan = (await loadPlans(supabase, locale, false)).find((p) => p.id === planId);
  if (!plan) return null;
  const [{ data: cams }, { data: drawing }] = await Promise.all([
    supabase.from("cameras").select("*").eq("plan_id", planId).order("position"),
    supabase.from("camera_drawings").select("*").eq("plan_id", planId).eq("is_current", true).maybeSingle(),
  ]);
  const cameras = (cams ?? []).map((c) => ({ ...c, x: Number(c.x), y: Number(c.y), angle: c.angle == null ? null : Number(c.angle) }));
  const { renderToStaticMarkup } = await import("react-dom/server");
  const svg = renderToStaticMarkup(createElement(StaticCameraMap, { shape: plan.shape, cameras }));
  const generated = new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date());

  const legend: Content = {
    columns: [
      { text: [{ text: "● ", color: "#16202e" }, t("cameraMaps.level", { n: 1 })], width: "auto" },
      { text: [{ text: "● ", color: "#0a6b70" }, t("cameraMaps.level", { n: 2 })], width: "auto" },
      { text: [{ text: "● ", color: "#a15c00" }, t("cameraMaps.level", { n: 3 })], width: "auto" },
      { text: [{ text: "■ ", color: "#d7372a" }, t("cameraMaps.special")], width: "auto" },
    ],
    columnGap: 16, fontSize: 8, margin: [0, 4, 0, 0],
  };

  const header = [t("cameraMaps.cols.number"), t("cameraMaps.cols.type"), t("cameraMaps.cols.lens"), t("cameraMaps.cols.function"), t("cameraMaps.cols.level"), t("cameraMaps.cols.special")]
    .map((h) => ({ text: h, bold: true, fillColor: "#eceef1" }));
  const rows = cameras.map((c) => [
    { text: c.number, bold: true }, t(`cameraTypes.${c.type}`), c.lens ?? "", pick(locale, c.function_en, c.function_tr), c.level, c.is_special ? "●" : "",
  ]);

  const doc: TDocumentDefinitions = {
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: [36, 44, 36, 40],
    info: { title: `${plan.venueTitle} – ${plan.sportTitle} – ${plan.title}`, author: "Medialuso – Host Broadcaster" },
    defaultStyle: { font: "Roboto", fontSize: 9, color: "#16202e" },
    header: { text: `Istanbul 2027 · ${t("nav.cameraMaps")}`, fontSize: 8, color: "#5b6676", margin: [36, 18, 36, 0] },
    footer: (page: number, pages: number) => ({
      columns: [
        { text: `${t("common.hostBroadcaster")} · ${generated}`, fontSize: 7, color: "#5b6676" },
        { text: t("handbook.pageOf", { n: page, total: pages }), alignment: "right", fontSize: 7, color: "#5b6676" },
      ],
      margin: [36, 14, 36, 0],
    }),
    content: [
      { text: `${plan.venueTitle} · ${plan.sportTitle}`, fontSize: 16, bold: true, color: "#0a6b70" },
      { text: `${plan.title} · ${plan.clusterTitle}${plan.level ? " · " + t(`venues.levels.${plan.level}`) : ""}`, fontSize: 10, color: "#5b6676", margin: [0, 2, 0, 6] },
      { text: `${t("cameraMaps.total", { n: plan.total })} · ${t("cameraMaps.specialsCount", { n: plan.specials })}`, fontSize: 9, margin: [0, 0, 0, 6] },
      { svg, width: 620, alignment: "center" },
      legend,
      { text: t("cameraMaps.cameraList"), fontSize: 12, bold: true, margin: [0, 10, 0, 6], pageBreak: "before" },
      { table: { headerRows: 1, widths: [30, 70, 70, "*", 35, 40], body: [header, ...rows] }, layout: "lightHorizontalLines" },
      ...(drawing ? [{ text: t("cameraMaps.drawingAttached", { v: drawing.version_number }), fontSize: 8, color: "#5b6676", margin: [0, 10, 0, 0] } as Content] : []),
    ],
  };

  const p = await printer();
  const pdfDoc = p.createPdfKitDocument(doc);
  const chunks: Buffer[] = [];
  const base = await new Promise<Buffer>((resolve, reject) => {
    pdfDoc.on("data", (c: Buffer) => chunks.push(c));
    pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
    pdfDoc.on("error", reject);
    pdfDoc.end();
  });

  const { PDFDocument } = await import("pdf-lib");
  const merged = await PDFDocument.load(base);
  if (drawing) {
    const { data: file } = await supabase.storage.from("camera-drawings").download(drawing.file_path);
    if (file) {
      try {
        const arch = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()), { ignoreEncryption: true });
        const pages = await merged.copyPages(arch, arch.getPageIndices());
        pages.forEach((pg) => merged.addPage(pg));
      } catch (e) {
        console.error("could not append drawing", e);
      }
    }
  }
  const slug = `${plan.venueSlug}-${plan.sportTitle}-${plan.title}`.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return { pdf: await merged.save(), name: `camera-map-${slug}-${locale}.pdf` };
}
