import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { tx } from "@/lib/i18n";
import { htmlToText, withDraft } from "@/lib/content/render";
import { isPreview } from "@/lib/preview";
import { Badge, PageHeader } from "@/components/ui";
import { FilterList } from "@/components/content/FilterList";
import { RichText } from "@/components/content/RichText";
import { PreviewBanner } from "@/components/content/PreviewBanner";

export const metadata = { title: "FAQ" };

export default async function FaqPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const preview = await isPreview(await searchParams);
  const { t, locale } = await getT();
  const supabase = await createClient();
  let cq = supabase.from("faq_categories").select("*").order("position");
  let fq = supabase.from("faqs").select("*").order("position");
  if (!preview) { cq = cq.eq("status", "published"); fq = fq.eq("status", "published"); }
  const [{ data: cats }, { data: faqs }] = await Promise.all([cq, fq]);
  const categories = (cats ?? []).map((c) => withDraft(c, preview));
  const catIds = new Set(categories.map((c) => c.id));
  const items = (faqs ?? []).map((f) => withDraft(f, preview)).filter((f) => catIds.has(f.category_id)).map((f) => {
    const question = tx(f, "question", locale);
    const answer = tx(f, "answer", locale);
    return {
      id: f.id,
      group: f.category_id,
      text: `${question} ${htmlToText(answer)}`,
      node: (
        <details className="card faq-item" id={`q-${f.id}`}>
          <summary>
            {question}{" "}
            {f.status !== "published" && <Badge tone="warning">{t("cms.status.draft")}</Badge>}
            {f.visibility === "rhb" && <Badge tone="info">{t("dashboard.rhbOnly")}</Badge>}
            {f.visibility === "partners" && <Badge tone="info">{t("dashboard.partnersOnly")}</Badge>}
          </summary>
          <RichText html={answer} />
        </details>
      ),
    };
  });
  return (
    <div className="stack">
      {preview && <PreviewBanner exitHref="/faq" />}
      <PageHeader title={t("faq.title")} />
      <FilterList
        items={items}
        groups={categories.map((c) => ({ id: c.id, title: tx(c, "title", locale) }))}
        placeholder={t("faq.searchPlaceholder")}
        noMatch={t("faq.noMatch")}
        emptyText={t("faq.empty")}
      />
    </div>
  );
}
