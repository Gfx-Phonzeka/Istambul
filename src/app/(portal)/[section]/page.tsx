import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { PLACEHOLDER_SECTIONS } from "@/lib/nav";
import { Card, EmptyState, PageHeader, Badge } from "@/components/ui";

export default async function SectionPlaceholder({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const key = PLACEHOLDER_SECTIONS[section];
  if (!key) notFound();
  const { t } = await getT();
  return (
    <div className="stack">
      <PageHeader title={t(`nav.${key}`)} subtitle={t(`sectionInfo.${key}`)} actions={<Badge tone="info">{t("common.comingSoon")}</Badge>} />
      <Card>
        <EmptyState icon="clock">{t("common.comingInStage", { n: t(`stageOf.${key}`) })}</EmptyState>
      </Card>
    </div>
  );
}
