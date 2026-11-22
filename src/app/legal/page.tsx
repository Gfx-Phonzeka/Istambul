import Link from "next/link";
import { PublicFrame } from "@/components/shell/PublicFrame";
import { getT } from "@/lib/i18n/server";
import { LEGAL_DOCS } from "@/lib/legal";
import { getProfile } from "@/lib/auth";

export const metadata = { title: "Legal documents" };

export default async function LegalIndex() {
  const { t } = await getT();
  const profile = await getProfile();
  return (
    <PublicFrame wide>
      <div className="stack">
        <h1>{t("nav.legal")}</h1>
        <ul className="list">
          {Object.entries(LEGAL_DOCS).map(([slug, doc]) => (
            <li key={slug}><Link href={`/legal/${slug}`}>{t(doc.titleKey)}</Link></li>
          ))}
        </ul>
        {profile?.status === "approved" && <Link href="/" className="small">← {t("nav.dashboard")}</Link>}
      </div>
    </PublicFrame>
  );
}
