import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export async function PreviewBanner({ exitHref }: { exitHref: string }) {
  const { t } = await getT();
  return (
    <div className="alert alert-warning row-between">
      <span>{t("cms.previewBanner")}</span>
      <Link href={exitHref} className="btn btn-sm">{t("cms.exitPreview")}</Link>
    </div>
  );
}
