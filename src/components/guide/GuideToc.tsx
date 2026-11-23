import Link from "next/link";
import { tx, type GuideChapter, type GuideLang } from "@/lib/guide";
import { Badge } from "@/components/ui";

export function GuideToc({ chapters, lang, current, preview, labels }: {
  chapters: GuideChapter[]; lang: GuideLang; current?: string; preview: boolean; labels: { contents: string; draft: string };
}) {
  const q = preview ? "?preview=1" : "";
  return (
    <nav className="hb-toc" aria-label={labels.contents}>
      <div className="nav-group-title">{labels.contents}</div>
      <ol>
        {chapters.map((c, ci) => (
          <li key={c.id}>
            <Link prefetch={false} href={`/team/guidelines/${c.slug}${q}`} className="hb-toc-chapter">
              {ci + 1}. {tx(c, "title", lang)} {c.status !== "published" && <Badge tone="warning">{labels.draft}</Badge>}
            </Link>
            <ol>
              {c.sections.map((s, si) => (
                <li key={s.id}>
                  <Link prefetch={false} href={`/team/guidelines/${c.slug}/${s.slug}${q}`} aria-current={current === s.id ? "page" : undefined}>
                    {ci + 1}.{si + 1} {tx(s, "title", lang)} {s.status !== "published" && <Badge tone="warning">{labels.draft}</Badge>}
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
