import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n";
import { withDraft } from "@/lib/content/render";
import { isPreview } from "@/lib/preview";
import { Badge, Icon, PageHeader } from "@/components/ui";
import { FilterList } from "@/components/content/FilterList";
import { PreviewBanner } from "@/components/content/PreviewBanner";

export const metadata = { title: "Contacts" };

export default async function ContactsPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const preview = await isPreview(await searchParams);
  const { t, locale } = await getT();
  const supabase = await createClient();
  let aq = supabase.from("contact_areas").select("*").order("position");
  let cq = supabase.from("contacts").select("*").order("position");
  if (!preview) { aq = aq.eq("status", "published"); cq = cq.eq("status", "published"); }
  const [{ data: areas }, { data: contacts }] = await Promise.all([aq, cq]);
  const areaList = (areas ?? []).map((a) => withDraft(a, preview));
  const ids = new Set(areaList.map((a) => a.id));
  const items = (contacts ?? []).map((c) => withDraft(c, preview)).filter((c) => ids.has(c.area_id)).map((c) => {
    const role = pick(locale, c.role_en, c.role_tr);
    return {
      id: c.id,
      group: c.area_id,
      text: `${c.name} ${role} ${c.email ?? ""} ${c.phone ?? ""}`,
      node: (
        <div className="card contact-card" id={`c-${c.id}`}>
          <div>
            <strong>{c.name}</strong> {c.status !== "published" && <Badge tone="warning">{t("cms.status.draft")}</Badge>}
            <div className="muted small">{role}</div>
          </div>
          <div className="contact-links small">
            {c.email && <a href={`mailto:${c.email}`}><Icon name="mail" size={16} /> {c.email}</a>}
            {c.phone && <a href={`tel:${c.phone.replace(/\s+/g, "")}`}>☎ {c.phone}</a>}
          </div>
        </div>
      ),
    };
  });
  return (
    <div className="stack">
      {preview && <PreviewBanner exitHref="/contacts" />}
      <PageHeader title={t("contacts.title")} subtitle={t("contacts.subtitle")} />
      <FilterList items={items} groups={areaList.map((a) => ({ id: a.id, title: pick(locale, a.title_en, a.title_tr) }))}
        placeholder={t("contacts.searchPlaceholder")} noMatch={t("glossary.noMatch")} emptyText={t("contacts.empty")} />
    </div>
  );
}
