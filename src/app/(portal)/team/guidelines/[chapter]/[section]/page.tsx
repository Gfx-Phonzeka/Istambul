import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeam, isStaff } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { isPreview } from "@/lib/preview";
import { getGuideContext } from "@/lib/guide-page";
import { decorateGuideHtml, tx } from "@/lib/guide";
import { withHeadingAnchors } from "@/lib/content/render";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui";
import { RichText } from "@/components/content/RichText";
import { PreviewBanner } from "@/components/content/PreviewBanner";
import { GuideToc } from "@/components/guide/GuideToc";
import { GuideLangSwitch } from "@/components/guide/GuideLangSwitch";

export default async function GuideSectionPage({ params, searchParams }: { params: Promise<{ chapter: string; section: string }>; searchParams: Promise<{ preview?: string }> }) {
  const me = await requireTeam();
  const { chapter: cslug, section: sslug } = await params;
  const preview = await isPreview(await searchParams);
  const { t, locale } = await getT();
  const { chapters, lang, ui } = await getGuideContext(preview);
  const ci = chapters.findIndex((c) => c.slug === cslug);
  if (ci < 0) notFound();
  const chapter = chapters[ci];
  const si = chapter.sections.findIndex((s) => s.slug === sslug);
  if (si < 0) notFound();
  const section = chapter.sections[si];
  const q = preview ? "?preview=1" : "";

  const flat = chapters.flatMap((c, i) => c.sections.map((s, j) => ({ href: `/team/guidelines/${c.slug}/${s.slug}`, label: `${i + 1}.${j + 1} ${tx(s, "title", lang)}`, id: s.id })));
  const pos = flat.findIndex((x) => x.id === section.id);
  const prev = flat[pos - 1];
  const next = flat[pos + 1];
  const { html, headings } = withHeadingAnchors(decorateGuideHtml(tx(section, "body", lang)));
  const staff = isStaff(me);
  const toc = <GuideToc chapters={chapters} lang={lang} current={section.id} preview={preview} labels={{ contents: ui("contents"), draft: t("cms.status.draft") }} />;

  return (
    <div className="stack">
      {preview && <PreviewBanner exitHref={`/team/guidelines/${cslug}/${sslug}`} />}
      <div className="hb-layout">
        <aside className="hb-aside">{toc}</aside>
        <article className="stack" style={{ minWidth: 0 }}>
          <details className="hb-toc-mobile card"><summary>{ui("contents")}</summary>{toc}</details>
          <div className="small muted">
            <Link href={`/team/guidelines${q}`}>{ui("title")}</Link> › <Link href={`/team/guidelines/${chapter.slug}${q}`}>{ci + 1}. {tx(chapter, "title", lang)}</Link>
          </div>
          <header className="row-between">
            <div>
              <h1 style={{ marginBottom: 4 }}>{ci + 1}.{si + 1} {tx(section, "title", lang)}</h1>
              <div className="row small muted">
                {section.content_updated_at && <span>{ui("updated", { date: formatDate(section.content_updated_at, locale) })}</span>}
                {staff && lang === "tr" && !section.tr_reviewed && <Badge tone="warning">{ui("trReview")}</Badge>}
              </div>
            </div>
            <div className="row">
              <GuideLangSwitch lang={lang} label={ui("language")} />
              {staff && <Link className="btn btn-sm" href={`/admin/content/guide_section/${section.id}`}>{t("cms.edit")}</Link>}
            </div>
          </header>
          {headings.length > 1 && (
            <nav className="hb-onpage card">
              <div className="nav-group-title">{ui("onThisPage")}</div>
              <ul>{headings.map((h) => <li key={h.id} style={{ paddingLeft: h.level === 3 ? 12 : 0 }}><a href={`#${h.id}`}>{h.text}</a></li>)}</ul>
            </nav>
          )}
          <div className="card"><RichText html={html} /></div>
          <nav className="hb-prevnext">
            {prev ? <Link href={prev.href + q} className="card card-link"><span className="muted small">← {ui("previous")}</span><div>{prev.label}</div></Link> : <span />}
            {next ? <Link href={next.href + q} className="card card-link" style={{ textAlign: "right" }}><span className="muted small">{ui("next")} →</span><div>{next.label}</div></Link> : <span />}
          </nav>
        </article>
      </div>
    </div>
  );
}
