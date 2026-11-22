import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n";
import { isPreview } from "@/lib/preview";
import { getHandbookTree } from "@/lib/handbook-page";
import { Card, EmptyState, PageHeader, Badge } from "@/components/ui";
import { HandbookExport } from "@/components/content/HandbookExport";
import { PreviewBanner } from "@/components/content/PreviewBanner";

export const metadata = { title: "Handbook" };

export default async function HandbookIndex({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const preview = await isPreview(await searchParams);
  const { t, locale } = await getT();
  const chapters = await getHandbookTree(preview);
  const q = preview ? "?preview=1" : "";
  return (
    <div className="stack">
      {preview && <PreviewBanner exitHref="/handbook" />}
      <PageHeader
        title={t("handbook.title")}
        subtitle={t("handbook.subtitle")}
        actions={
          chapters.length > 0 && (
            <>
              <a className="btn" href={`/api/handbook/pdf/full?lang=${locale}`}>{t("handbook.downloadFull")}</a>
              <HandbookExport chapters={chapters.map((c) => ({ id: c.id, title: pick(locale, c.title_en, c.title_tr), sections: c.sections.map((s) => ({ id: s.id, title: pick(locale, s.title_en, s.title_tr) })) }))} />
            </>
          )
        }
      />
      {chapters.length === 0 ? (
        <Card><EmptyState icon="book" action={{ label: t("common.contactHost"), href: "/contacts" }}>{t("handbook.empty")}</EmptyState></Card>
      ) : (
        <div className="grid grid-2">
          {chapters.map((c, ci) => (
            <Card key={c.id} title={<Link href={`/handbook/${c.slug}${q}`}>{ci + 1}. {pick(locale, c.title_en, c.title_tr)}</Link>}>
              {pick(locale, c.summary_en, c.summary_tr) && <p className="muted small">{pick(locale, c.summary_en, c.summary_tr)}</p>}
              <ol className="list">
                {c.sections.map((s, si) => (
                  <li key={s.id}>
                    <Link href={`/handbook/${c.slug}/${s.slug}${q}`}>{ci + 1}.{si + 1} {pick(locale, s.title_en, s.title_tr)}</Link>{" "}
                    {s.visibility === "partners" && <Badge tone="info">{t("dashboard.partnersOnly")}</Badge>}
                    {s.visibility === "internal" && <Badge tone="warning">{t("dashboard.internalOnly")}</Badge>}
                    {s.status !== "published" && <Badge tone="warning">{t("cms.status.draft")}</Badge>}
                  </li>
                ))}
              </ol>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
