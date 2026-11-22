import Link from "next/link";
import { pick, type Locale } from "@/lib/i18n";
import type { HbChapter } from "@/lib/handbook";
import { Badge } from "@/components/ui";

export function HandbookToc({ chapters, locale, current, preview, labels }: {
  chapters: HbChapter[]; locale: Locale; current?: string; preview: boolean; labels: { contents: string; draft: string };
}) {
  const q = preview ? "?preview=1" : "";
  return (
    <nav className="hb-toc" aria-label={labels.contents}>
      <div className="nav-group-title">{labels.contents}</div>
      <ol>
        {chapters.map((c, ci) => (
          <li key={c.id}>
            <Link href={`/handbook/${c.slug}${q}`} className="hb-toc-chapter">
              {ci + 1}. {pick(locale, c.title_en, c.title_tr)} {c.status !== "published" && <Badge tone="warning">{labels.draft}</Badge>}
            </Link>
            <ol>
              {c.sections.map((s, si) => (
                <li key={s.id}>
                  <Link href={`/handbook/${c.slug}/${s.slug}${q}`} aria-current={current === s.id ? "page" : undefined}>
                    {ci + 1}.{si + 1} {pick(locale, s.title_en, s.title_tr)} {s.status !== "published" && <Badge tone="warning">{labels.draft}</Badge>}
                  </Link>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </nav>
  );
}
