// Helpers to display stored rich text.

export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i")
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "section";
}

export interface Heading {
  id: string;
  text: string;
  level: number;
}

/** Adds shareable ids to h2/h3 headings and returns the list of headings. */
export function withHeadingAnchors(html: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = [];
  const used = new Set<string>();
  const out = (html ?? "").replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_m, level: string, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    let id = slugify(text);
    let n = 2;
    while (used.has(id)) id = `${slugify(text)}-${n++}`;
    used.add(id);
    headings.push({ id, text, level: Number(level) });
    return `<h${level} id="${id}">${inner}<a class="anchor" href="#${id}" aria-label="Link">#</a></h${level}>`;
  });
  return { html: out, headings };
}

export function htmlToText(html: string | null | undefined): string {
  return (html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function excerpt(html: string | null | undefined, max = 220): string {
  const t = htmlToText(html);
  return t.length > max ? t.slice(0, max).replace(/\s+\S*$/, "") + "…" : t;
}

/** Merges pending draft changes over the live row (used for staff previews). */
export function withDraft<T extends { draft?: Record<string, unknown> | null }>(row: T, preview: boolean): T {
  return preview && row.draft ? { ...row, ...row.draft } : row;
}
