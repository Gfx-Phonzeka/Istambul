import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicFrame } from "@/components/shell/PublicFrame";
import { getT } from "@/lib/i18n/server";
import { LEGAL_DOCS, type LegalSlug } from "@/lib/legal";

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = LEGAL_DOCS[slug as LegalSlug];
  if (!doc) notFound();
  const { t, locale } = await getT();
  return (
    <PublicFrame wide>
      <article className="stack">
        <h1>{t(doc.titleKey)}</h1>
        <div className="alert alert-warning">{t("legal.draftNote")}</div>
        {doc[locale].map((p, i) => <p key={i}>{p}</p>)}
        <Link href="/legal" className="small">← {t("nav.legal")}</Link>
      </article>
    </PublicFrame>
  );
}
