import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n";
import { ALL_NAV } from "@/lib/nav";
import { Badge, Card, EmptyState, PageHeader, Icon } from "@/components/ui";
import { AutofocusDesktop } from "@/components/AutofocusDesktop";

export const metadata = { title: "Search" };

interface Hit { kind: string; id: string; title_en: string; title_tr: string | null; text_en: string | null; text_tr: string | null; href: string }

function snippet(text: string, term: string): string {
  const i = text.toLocaleLowerCase().indexOf(term);
  if (i < 0) return text.slice(0, 180) + (text.length > 180 ? "…" : "");
  const start = Math.max(0, i - 70);
  return (start > 0 ? "…" : "") + text.slice(start, i + 130) + (i + 130 < text.length ? "…" : "");
}

function Highlight({ text, term }: { text: string; term: string }) {
  if (!term) return <>{text}</>;
  const parts: React.ReactNode[] = [];
  const lower = text.toLocaleLowerCase();
  let pos = 0;
  let i = lower.indexOf(term);
  while (i >= 0 && parts.length < 20) {
    parts.push(text.slice(pos, i), <mark key={i}>{text.slice(i, i + term.length)}</mark>);
    pos = i + term.length;
    i = lower.indexOf(term, pos);
  }
  parts.push(text.slice(pos));
  return <>{parts}</>;
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const { t, locale } = await getT();
  const term = q.trim().toLocaleLowerCase().slice(0, 100);
  let hits: Hit[] = [];
  if (term.length >= 2) {
    const supabase = await createClient();
    const s = term.replace(/[%_,()*\\]/g, " ").trim();
    const { data } = await supabase
      .from("content_index")
      .select("kind,id,title_en,title_tr,text_en,text_tr,href")
      .or(`title_en.ilike.%${s}%,title_tr.ilike.%${s}%,text_en.ilike.%${s}%,text_tr.ilike.%${s}%`)
      .limit(60);
    hits = (data ?? []) as Hit[];
    // Titles that match first
    hits.sort((a, b) => Number(!`${a.title_en} ${a.title_tr}`.toLocaleLowerCase().includes(term)) - Number(!`${b.title_en} ${b.title_tr}`.toLocaleLowerCase().includes(term)));
  }
  const sections = term ? ALL_NAV.filter((n) => `${t(`nav.${n.key}`)} ${t(`sectionInfo.${n.key}`)}`.toLocaleLowerCase().includes(term)) : [];
  const total = hits.length + sections.length;

  return (
    <div className="stack">
      <PageHeader title={t("search.title")} subtitle={q ? t("search.resultsFor", { q }) : undefined} />
      <form className="row" role="search">
        <input name="q" type="search" className="input" aria-label={t("common.search")} autoComplete="off" defaultValue={q} placeholder={t("common.searchPlaceholder")} style={{ flex: 1, minWidth: 0 }} data-autofocus-desktop />
        <AutofocusDesktop />
        <button className="btn btn-primary">{t("common.search")}</button>
      </form>
      <p className="muted small" style={{ margin: 0 }}>{t("search.stageNote")}</p>
      {q && (
        <Card>
          {total === 0 ? (
            <EmptyState icon="search" action={{ label: t("common.browseFaq"), href: "/faq" }}>{t("search.noResults")}</EmptyState>
          ) : (
            <ul className="list">
              {sections.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="row"><Icon name={n.icon} /> <strong>{t(`nav.${n.key}`)}</strong></Link>
                  <div className="muted small">{t(`sectionInfo.${n.key}`)}</div>
                </li>
              ))}
              {hits.map((h) => {
                const title = pick(locale, h.title_en, h.title_tr);
                const text = pick(locale, h.text_en, h.text_tr);
                return (
                  <li key={`${h.kind}-${h.id}`}>
                    <div className="row" style={{ gap: 8 }}>
                      <Badge tone="primary">{t(`kinds.${h.kind}`)}</Badge>
                      <Link href={h.href}><strong><Highlight text={title} term={term} /></strong></Link>
                    </div>
                    {text && <div className="small muted" style={{ marginTop: 4 }}><Highlight text={snippet(text, term)} term={term} /></div>}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
