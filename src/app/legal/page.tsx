import Link from "next/link";
import { PublicFrame } from "@/components/shell/PublicFrame";
import { getT } from "@/lib/i18n/server";
import { tx, cols } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

export const metadata = { title: "Legal documents" };

export default async function LegalIndex() {
  const { t, locale } = await getT();
  const supabase = await createClient();
  const { data } = await supabase.from("legal_pages").select(`slug,${cols("title")}` as "*").eq("status", "published").order("position");
  const profile = await getProfile();
  return (
    <PublicFrame wide>
      <div className="stack">
        <h1>{t("nav.legal")}</h1>
        <ul className="list">
          {(data ?? []).map((d) => (
            <li key={d.slug}><Link href={`/legal/${d.slug}`}>{tx(d, "title", locale)}</Link></li>
          ))}
        </ul>
        {profile?.status === "approved" && <Link href="/" className="small">← {t("nav.dashboard")}</Link>}
      </div>
    </PublicFrame>
  );
}
