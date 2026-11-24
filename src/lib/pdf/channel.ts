import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { EVENT } from "@/lib/event";
import { dictionaries, intlLocale, translate, type Locale } from "@/lib/i18n";
import { getPrinter } from "@/lib/pdf/handbook";
import { BRAND, loadChannel } from "@/lib/channel-data";
import { KIND_COLOR } from "@/lib/channel";
import { dayLabel } from "@/lib/channel";

/** Integrated Channel grid as a landscape PDF, one page per day, in the portal's colours. */
export async function buildChannelPdf(supabase: SupabaseClient, locale: Locale, days?: string[]): Promise<Buffer> {
  const t = (k: string, v?: Record<string, string | number>) => translate(dictionaries[locale], k, v);
  const rows = await loadChannel(supabase, locale, { days });
  const intl = intlLocale(locale);
  const byDay = new Map<string, typeof rows>();
  rows.forEach((r) => { if (!byDay.has(r.slot.day)) byDay.set(r.slot.day, []); byDay.get(r.slot.day)!.push(r); });
  const generated = new Intl.DateTimeFormat(intl, { dateStyle: "medium", timeStyle: "short", timeZone: EVENT.tz }).format(new Date());

  const pages: Content[] = [...byDay.entries()].map(([day, list], i) => ({
    stack: [
      { canvas: [{ type: "rect", x: 0, y: 0, w: 762, h: 46, r: 6, color: BRAND.primary }] },
      { text: `${t("channel.title").toUpperCase()} · ${EVENT.name}`, color: "#ffffff", fontSize: 9, bold: true, margin: [14, -40, 0, 0] },
      { text: dayLabel(day, intl, { weekday: "long", day: "numeric", month: "long", year: "numeric" }), color: "#ffffff", fontSize: 16, bold: true, margin: [14, 2, 0, 14] },
      {
        table: {
          headerRows: 1,
          widths: [70, 90, "*", 150, 170],
          body: [
            [t("channel.time"), t("channel.type"), t("channel.programme"), `${t("venues.sport")} · ${t("schedule.venue")}`, t("channel.admin.notes")]
              .map((h) => ({ text: h, bold: true, color: BRAND.ink, fillColor: "#eef1f7", fontSize: 9 })),
            ...list.map((r) => [
              { text: `${r.slot.start_time}${r.slot.end_time ? `–${r.slot.end_time}` : ""}`, bold: true, fontSize: 10 },
              { text: t(`channel.kinds.${r.slot.kind}`), color: "#ffffff", fillColor: KIND_COLOR[r.slot.kind] ?? "#5b6676", fontSize: 9, bold: true },
              { text: r.title || "—", bold: true, fontSize: 10, color: BRAND.ink },
              { text: [r.sport, r.venue].filter(Boolean).join(" · ") || "—", fontSize: 9, color: "#374151" },
              { text: r.notes || "", fontSize: 9, color: "#374151" },
            ]),
          ],
        },
        layout: {
          hLineColor: () => "#d8dee9", vLineColor: () => "#ffffff", hLineWidth: (i: number) => (i === 0 ? 0 : 0.6), vLineWidth: () => 0,
          paddingTop: () => 6, paddingBottom: () => 6, paddingLeft: () => 6, paddingRight: () => 6,
        },
      },
      { text: t("channel.note", { tz: EVENT.utcOffset }), fontSize: 8, color: "#5b6676", margin: [0, 10, 0, 0] },
    ],
    pageBreak: i === 0 ? undefined : "before",
  }) as Content);

  const doc: TDocumentDefinitions = {
    pageSize: "A4", pageOrientation: "landscape", pageMargins: [40, 36, 40, 40],
    info: { title: `${EVENT.name} · ${t("channel.title")}` },
    defaultStyle: { font: "Roboto", fontSize: 10 },
    content: pages.length ? pages : [{ text: t("channel.empty") }],
    footer: (page: number, total: number) => ({
      columns: [
        { text: `${EVENT.hbName} · Host Broadcaster · ${generated}`, fontSize: 8, color: "#5b6676" },
        { text: `${page} / ${total}`, alignment: "right", fontSize: 8, color: "#5b6676" },
      ],
      margin: [40, 12, 40, 0],
    }),
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
