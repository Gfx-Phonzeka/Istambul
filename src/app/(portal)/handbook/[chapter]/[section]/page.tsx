import Link from "next/link";
import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { tx } from "@/lib/i18n";
import { isPreview } from "@/lib/preview";
import { getHandbookBody, getHandbookTree } from "@/lib/handbook-page";
import { withHeadingAnchors } from "@/lib/content/render";
import { formatDate } from "@/lib/format";
import { getProfile, isStaff } from "@/lib/auth";
import { Badge } from "@/components/ui";
import { HandbookToc } from "@/components/content/HandbookToc";
import { RichText } from "@/components/content/RichText";
import { PreviewBanner } from "@/components/content/PreviewBanner";

export default async function SectionPage({ params, searchParams }: { params: Promise<{ chapter: string; section: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { chapter: cslug, section: sslug } = await params;
  const preview = await isPreview(await searchParams);
  const { t, locale } = await getT();
  const chapters = await getHandbookTree(preview);
  const ci = chapters.findIndex((c) => c.slug === cslug);
  if (ci < 0) notFound();
  const chapter = chapters[ci];
  const si = chapter.sections.findIndex((s) => s.slug === sslug);
  if (si < 0) notFound();
  const section = chapter.sections[si];

  // Flat list for previous / next navigation across chapters
  const flat = chapters.flatMap((c, i) => c.sections.map((s, j) => ({ href: `/handbook/${c.slug}/${s.slug}`, label: `${i + 1}.${j + 1} ${tx(s, "title", locale)}`, id: s.id })));
  const pos = flat.findIndex((x) => x.id === section.id);
  const prev = flat[pos - 1];
  const next = flat[pos + 1];
  const q = preview ? "?preview=1" : "";

  const body = await getHandbookBody(section.id, preview);
  const { html, headings } = withHeadingAnchors(tx(body, "body", locale));
  const staff = isStaff(await getProfile());

  return (
    <div className="stack">
      {preview && <PreviewBanner exitHref={`/handbook/${cslug}/${sslug}`} />}
      <div className="hb-layout">
        <aside className="hb-aside">
          <HandbookToc chapters={chapters} locale={locale} current={section.id} preview={preview} labels={{ contents: t("handbook.contents"), draft: t("cms.status.draft") }} />
        </aside>
        <article className="stack" style={{ minWidth: 0 }}>
          <details className="hb-toc-mobile card">
            <summary>{t("handbook.contents")}</summary>
            <HandbookToc chapters={chapters} locale={locale} current={section.id} preview={preview} labels={{ contents: t("handbook.contents"), draft: t("cms.status.draft") }} />
          </details>
          <div className="small muted">
            <Link href={`/handbook${q}`}>{t("handbook.title")}</Link> › <Link href={`/handbook/${chapter.slug}${q}`}>{ci + 1}. {tx(chapter, "title", locale)}</Link>
          </div>
          <header className="row-between">
            <div>
              <h1 style={{ marginBottom: 4 }}>{ci + 1}.{si + 1} {tx(section, "title", locale)}</h1>
              <div className="row small muted">
                {section.content_updated_at && <span>{t("handbook.updated", { date: formatDate(section.content_updated_at, locale) })}</span>}
                {section.visibility === "rhb" && <Badge tone="info">{t("dashboard.rhbOnly")}</Badge>}
                {section.visibility === "partners" && <Badge tone="info">{t("dashboard.partnersOnly")}</Badge>}
                {section.visibility === "production" && <Badge tone="success">{t("dashboard.productionOnly")}</Badge>}
                {section.visibility === "internal" && <Badge tone="warning">{t("dashboard.internalOnly")}</Badge>}
              </div>
            </div>
            {staff && <Link className="btn btn-sm" href={`/admin/content/handbook_section/${section.id}`}>{t("cms.edit")}</Link>}
          </header>
          {headings.length > 1 && (
            <nav className="hb-onpage card">
              <div className="nav-group-title">{t("handbook.onThisPage")}</div>
              <ul>
                {headings.map((h) => (
                  <li key={h.id} style={{ paddingLeft: h.level === 3 ? 12 : 0 }}><a href={`#${h.id}`}>{h.text}</a></li>
                ))}
              </ul>
            </nav>
          )}
          <div className="card"><RichText html={html} /></div>
          <nav className="hb-prevnext">
            {prev ? <Link href={prev.href + q} className="card card-link"><span className="muted small">← {t("handbook.previous")}</span><div>{prev.label}</div></Link> : <span />}
            {next ? <Link href={next.href + q} className="card card-link" style={{ textAlign: "right" }}><span className="muted small">{t("handbook.next")} →</span><div>{next.label}</div></Link> : <span />}
          </nav>
        </article>
      </div>
    </div>
  );
}
