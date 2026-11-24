import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { tx } from "@/lib/i18n";
import { withDraft } from "@/lib/content/render";
import { isPreview } from "@/lib/preview";
import { Badge, PageHeader } from "@/components/ui";
import { FilterList } from "@/components/content/FilterList";
import { PreviewBanner } from "@/components/content/PreviewBanner";

export const metadata = { title: "Glossary" };

export default async function GlossaryPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const preview = await isPreview(await searchParams);
  const { t, locale } = await getT();
  const supabase = await createClient();
  let q = supabase.from("glossary_terms").select("*");
  if (!preview) q = q.eq("status", "published");
  const { data } = await q;
  const terms = (data ?? []).map((g) => withDraft(g, preview)).map((g) => ({ ...g, term: tx(g, "term", locale), def: tx(g, "definition", locale) }));
  terms.sort((a, b) => a.term.localeCompare(b.term, locale));
  const letters = [...new Set(terms.map((x) => x.term[0]?.toLocaleUpperCase(locale) ?? "#"))];
  const items = terms.map((g) => ({
    id: g.id,
    group: g.term[0]?.toLocaleUpperCase(locale) ?? "#",
    text: `${g.term} ${g.def} ${g.term_en}`,
    node: (
      <div className="card glossary-item" id={`t-${g.id}`}>
        <dt><strong>{g.term}</strong>{locale !== "en" && g.term_en && g.term !== g.term_en && <span className="muted small"> · {g.term_en}</span>}{" "}
          {g.status !== "published" && <Badge tone="warning">{t("cms.status.draft")}</Badge>}</dt>
        <dd>{g.def}</dd>
      </div>
    ),
  }));
  return (
    <div className="stack">
      {preview && <PreviewBanner exitHref="/glossary" />}
      <PageHeader title={t("glossary.title")} subtitle={t("glossary.subtitle")} />
      <FilterList items={items} groups={letters.map((l) => ({ id: l, title: l }))} placeholder={t("glossary.searchPlaceholder")} noMatch={t("glossary.noMatch")} emptyText={t("glossary.empty")} />
    </div>
  );
}
