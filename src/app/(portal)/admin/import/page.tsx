import { requireStaff } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui";
import { ImportPanel } from "@/components/admin/ImportPanel";

export const metadata = { title: "Import" };

export default async function ImportPage() {
  await requireStaff();
  const { t } = await getT();
  return (
    <div className="stack">
      <PageHeader title={t("import.title")} subtitle={t("import.subtitle")} />
      <ImportPanel dataset="sessions" />
      <ImportPanel dataset="feeds" />
    </div>
  );
}
