import Link from "next/link";
import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n";
import { isPreview } from "@/lib/preview";
import { getHandbookTree } from "@/lib/handbook-page";
import { Card, PageHeader } from "@/components/ui";
import { HandbookToc } from "@/components/content/HandbookToc";
import { HandbookExport } from "@/components/content/HandbookExport";
import { PreviewBanner } from "@/components/content/PreviewBanner";

export default async function ChapterPage({ params, searchParams }: { params: Promise<{ chapter: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { chapter: slug } = await params;
  const preview = await isPreview(await searchParams);
  const { t, locale } = await getT();
  const chapters = await getHandbookTree(preview);
  const ci = chapters.findIndex((c) => c.slug === slug);
  if (ci < 0) notFound();
  const c = chapters[ci];
  const q = preview ? "?preview=1" : "";
  return (
    <div className="stack">
      {preview && <PreviewBanner exitHref={`/handbook/${slug}`} />}
      <div className="hb-layout">
        <aside className="hb-aside">
          <HandbookToc chapters={chapters} locale={locale} preview={preview} labels={{ contents: t("handbook.contents"), draft: t("cms.status.draft") }} />
        </aside>
        <div className="stack">
          <Link href={`/handbook${q}`} className="small">← {t("handbook.title")}</Link>
          <PageHeader
            title={`${ci + 1}. ${pick(locale, c.title_en, c.title_tr)}`}
            subtitle={pick(locale, c.summary_en, c.summary_tr) || undefined}
            actions={<HandbookExport defaultChapter={c.id} chapters={chapters.map((x) => ({ id: x.id, title: pick(locale, x.title_en, x.title_tr), sections: x.sections.map((s) => ({ id: s.id, title: pick(locale, s.title_en, s.title_tr) })) }))} />}
          />
          <Card>
            <ol className="list">
              {c.sections.map((s, si) => (
                <li key={s.id}><Link href={`/handbook/${c.slug}/${s.slug}${q}`}>{ci + 1}.{si + 1} {pick(locale, s.title_en, s.title_tr)}</Link></li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
