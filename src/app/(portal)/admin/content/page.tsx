import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { CONTENT_GROUPS, CONTENT_TYPES } from "@/lib/content/registry";
import { Card, PageHeader } from "@/components/ui";
import { RegeneratePdfButton } from "./RegeneratePdfButton";

export const metadata = { title: "Content" };

export default async function ContentHome() {
  await requireStaff();
  const { t } = await getT();
  const supabase = await createClient();
  const counts = Object.fromEntries(
    await Promise.all(
      Object.values(CONTENT_TYPES).map(async (ct) => {
        const { count } = await supabase.from(ct.table).select("id", { count: "exact", head: true });
        return [ct.key, count ?? 0] as const;
      }),
    ),
  );
  return (
    <div className="stack">
      <PageHeader title={t("cms.title")} subtitle={t("cms.intro")} />
      <div className="grid grid-3">
        {CONTENT_GROUPS.map((g) => (
          <Card key={g.label} title={t(g.label)}>
            <ul className="list">
              {g.types.map((k) => (
                <li key={k} className="row-between">
                  <Link href={`/admin/content/${k}`}>{t(CONTENT_TYPES[k].label)}</Link>
                  <span className="muted small">{t("cms.items", { n: counts[k] })}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <Card title={t("nav.handbook") + " · PDF"}>
        <p className="small muted">{t("cms.pdfAutoNote")}</p>
        <RegeneratePdfButton />
      </Card>
    </div>
  );
}
