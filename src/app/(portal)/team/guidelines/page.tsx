import { requireTeam } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { Card, EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "Production Guidelines" };

// Placeholder until the Production Guidelines chapters are imported (next increment).
export default async function GuidelinesPage() {
  await requireTeam();
  const { t } = await getT();
  return (
    <div className="stack">
      <PageHeader title={t("team.links.guidelines")} subtitle={t("team.links.guidelinesHint")} />
      <Card><EmptyState icon="book" action={{ label: t("team.title"), href: "/team" }}>{t("team.guidelinesSoon")}</EmptyState></Card>
    </div>
  );
}
