import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { ALL_NAV } from "@/lib/nav";
import { Card, EmptyState, PageHeader, Icon } from "@/components/ui";

export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const { t } = await getT();
  const term = q.trim().toLocaleLowerCase();
  const results = term
    ? ALL_NAV.filter((n) => `${t(`nav.${n.key}`)} ${t(`sectionInfo.${n.key}`)}`.toLocaleLowerCase().includes(term))
    : [];
  return (
    <div className="stack">
      <PageHeader title={t("search.title")} subtitle={q ? t("search.resultsFor", { q }) : undefined} />
      <form className="row" role="search">
        <input name="q" type="search" className="input" defaultValue={q} placeholder={t("common.searchPlaceholder")} style={{ flex: 1, minWidth: 0 }} />
        <button className="btn btn-primary">{t("common.search")}</button>
      </form>
      <div className="alert alert-info">{t("search.stageNote")}</div>
      {q && (
        <Card>
          {results.length === 0 ? (
            <EmptyState icon="search">{t("search.noResults")}</EmptyState>
          ) : (
            <ul className="list">
              {results.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="row"><Icon name={n.icon} /> <strong>{t(`nav.${n.key}`)}</strong></Link>
                  <div className="muted small">{t(`sectionInfo.${n.key}`)}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
