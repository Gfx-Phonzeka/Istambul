import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { CONTENT_TYPES, isContentType } from "@/lib/content/registry";
import { formatDateTime } from "@/lib/format";
import { Badge, EmptyState, PageHeader } from "@/components/ui";

export default async function ContentList({ params }: { params: Promise<{ type: string }> }) {
  await requireStaff();
  const { type: key } = await params;
  if (!isContentType(key)) notFound();
  const type = CONTENT_TYPES[key];
  const { t, locale } = await getT();
  const supabase = await createClient();
  let q = supabase.from(type.table).select("*");
  for (const o of type.order) q = q.order(o.column, { ascending: o.ascending });
  const { data } = await q;
  const rows = (data ?? []) as Record<string, unknown>[];

  let parents: Record<string, string> = {};
  if (type.parent) {
    const pt = CONTENT_TYPES[type.parent.type];
    const { data: p } = await supabase.from(pt.table).select(`id, ${pt.titleColumn}`);
    parents = Object.fromEntries(((p ?? []) as unknown as Record<string, string>[]).map((r) => [r.id, r[pt.titleColumn]]));
    // keep rows grouped by the parent's own order
  }
  const hasVisibility = type.fields.some((f) => f.name === "visibility");

  return (
    <div className="stack">
      <PageHeader
        title={t(type.label)}
        actions={<Link href={`/admin/content/${key}/new`} className="btn btn-primary">+ {t("cms.new")} {t(type.singular)}</Link>}
      />
      <Link href="/admin/content" className="small">← {t("cms.title")}</Link>
      {rows.length === 0 ? (
        <div className="card"><EmptyState icon="file" action={{ label: t("common.createNew"), href: `/admin/content/${key}/new` }}>{t("cms.noItems")}</EmptyState></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t(type.fields.find((f) => `${f.name}_en` === type.titleColumn || f.name === type.titleColumn)?.label ?? "cms.fields.title")}</th>
                {type.parent && <th>{t(CONTENT_TYPES[type.parent.type].singular)}</th>}
                <th>{t("common.status")}</th>
                {hasVisibility && <th>{t("cms.fields.visibility")}</th>}
                <th>{t("cms.lastUpdate")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={String(r.id)}>
                  <td>
                    <Link href={`/admin/content/${key}/${r.id}`}><strong>{String(r[type.titleColumn] ?? "—")}</strong></Link>
                    {typeof r.slug === "string" && <div className="muted">/{r.slug}</div>}
                  </td>
                  {type.parent && <td>{parents[String(r[type.parent.column])] ?? "—"}</td>}
                  <td>
                    <div className="row" style={{ gap: 4 }}>
                      <Badge tone={r.status === "published" ? "success" : "warning"}>{t(`cms.status.${r.status}`)}</Badge>
                      {r.draft ? <Badge tone="info">{t("cms.status.changes")}</Badge> : null}
                    </div>
                  </td>
                  {hasVisibility && <td>{t(`cms.visibility.${r.visibility}`)}</td>}
                  <td style={{ whiteSpace: "nowrap" }}>{formatDateTime(String(r.updated_at), locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
