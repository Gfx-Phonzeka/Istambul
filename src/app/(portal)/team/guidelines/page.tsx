import Link from "next/link";
import { requireTeam, isStaff } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { isPreview } from "@/lib/preview";
import { getGuideContext } from "@/lib/guide-page";
import { openPoints, tx } from "@/lib/guide";
import { Alert, Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { PreviewBanner } from "@/components/content/PreviewBanner";
import { GuideLangSwitch } from "@/components/guide/GuideLangSwitch";
import { GuideExport } from "@/components/guide/GuideExport";
import { GUIDE_UI } from "@/lib/guide";

export const metadata = { title: "Production Guidelines" };

export default async function GuidelinesPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const me = await requireTeam();
  const preview = await isPreview(await searchParams);
  const { t } = await getT();
  const { chapters, lang, ui } = await getGuideContext(preview);
  const staff = isStaff(me);
  const q = preview ? "?preview=1" : "";
  const open = staff
    ? chapters.flatMap((c, ci) => c.sections.flatMap((s, si) => openPoints(tx(s, "body", lang)).map((p) => ({
        href: `/team/guidelines/${c.slug}/${s.slug}${q}`, where: `${ci + 1}.${si + 1} ${tx(s, "title", lang)}`, text: p, edit: `/admin/content/guide_section/${s.id}`,
      }))))
    : [];
  const trPending = staff && lang === "tr" ? chapters.some((c) => !c.tr_reviewed || c.sections.some((s) => !s.tr_reviewed)) : false;

  return (
    <div className="stack">
      {preview && <PreviewBanner exitHref="/team/guidelines" />}
      <PageHeader title={ui("title")} subtitle={ui("subtitle")} actions={<div className="row"><GuideLangSwitch lang={lang} label={ui("language")} />{chapters.length > 0 && <GuideExport lang={lang} labels={GUIDE_UI[lang]} chapters={chapters.map((x) => ({ id: x.id, title: tx(x, "title", lang), sections: x.sections.map((s) => ({ id: s.id, title: tx(s, "title", lang) })) }))} />}</div>} />
      <Alert tone="info">{ui("confidential")}</Alert>
      {trPending && <Alert tone="warning">{ui("trReview")}</Alert>}
      {chapters.length === 0 ? <Card><EmptyState icon="book" action={{ label: t("team.title"), href: "/team" }}>{t("team.guidelinesSoon")}</EmptyState></Card> : (
        <div className="grid grid-2">
          {chapters.map((c, ci) => (
            <Link key={c.id} href={`/team/guidelines/${c.slug}${q}`} className="card card-link stack-sm">
              <div className="row-between" style={{ width: "100%" }}>
                <span className="muted small">{ui("chapter")} {ci + 1} · {c.sections.length} {ui("sections")}</span>
                {c.status !== "published" && <Badge tone="warning">{t("cms.status.draft")}</Badge>}
              </div>
              <strong style={{ fontSize: "var(--text-lg)", display: "block" }}>{tx(c, "title", lang)}</strong>
              {tx(c, "summary", lang) && <span className="muted small" style={{ display: "block" }}>{tx(c, "summary", lang).split("\n\n")[0]}</span>}
            </Link>
          ))}
        </div>
      )}
      {staff && (
        <Card title={`${ui("openPoints")} (${open.length})`}>
          <p className="muted small" style={{ marginTop: 0 }}>{ui("openPointsHelp")}</p>
          {open.length === 0 ? <p className="muted">{ui("tbcNone")}</p> : (
            <ul className="stack-sm" style={{ paddingLeft: 18, margin: 0 }}>
              {open.map((o, i) => (
                <li key={i}>
                  <Link href={o.href}>{o.where}</Link> · <mark className="tbc"><b>TBC</b>{o.text ? ` ${o.text}` : ""}</mark>{" "}
                  <Link href={o.edit} className="small">({t("cms.edit")})</Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
