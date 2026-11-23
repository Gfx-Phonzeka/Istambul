import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeam } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { isPreview } from "@/lib/preview";
import { getGuideContext } from "@/lib/guide-page";
import { tx } from "@/lib/guide";
import { Card, PageHeader } from "@/components/ui";
import { PreviewBanner } from "@/components/content/PreviewBanner";
import { GuideToc } from "@/components/guide/GuideToc";
import { GuideLangSwitch } from "@/components/guide/GuideLangSwitch";

export default async function GuideChapterPage({ params, searchParams }: { params: Promise<{ chapter: string }>; searchParams: Promise<{ preview?: string }> }) {
  await requireTeam();
  const { chapter: slug } = await params;
  const preview = await isPreview(await searchParams);
  const { t } = await getT();
  const { chapters, lang, ui } = await getGuideContext(preview);
  const ci = chapters.findIndex((c) => c.slug === slug);
  if (ci < 0) notFound();
  const c = chapters[ci];
  const q = preview ? "?preview=1" : "";
  const summary = tx(c, "summary", lang);
  return (
    <div className="stack">
      {preview && <PreviewBanner exitHref={`/team/guidelines/${slug}`} />}
      <div className="hb-layout">
        <aside className="hb-aside">
          <GuideToc chapters={chapters} lang={lang} preview={preview} labels={{ contents: ui("contents"), draft: t("cms.status.draft") }} />
        </aside>
        <div className="stack">
          <Link href={`/team/guidelines${q}`} className="small">← {ui("title")}</Link>
          <PageHeader title={`${ci + 1}. ${tx(c, "title", lang)}`} actions={<GuideLangSwitch lang={lang} label={ui("language")} />} />
          {summary && <div className="prose">{summary.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}</div>}
          <Card>
            <ol className="list">
              {c.sections.map((s, si) => (
                <li key={s.id}><Link href={`/team/guidelines/${c.slug}/${s.slug}${q}`}>{ci + 1}.{si + 1} {tx(s, "title", lang)}</Link></li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
