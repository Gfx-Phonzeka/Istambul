import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { saveCeremony } from "@/lib/actions/admin";
import { Card, PageHeader } from "@/components/ui";

export const metadata = { title: "Settings" };

function toIstanbulLocal(iso: string | undefined) {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 3 * 3600000); // TRT = UTC+3 (no DST)
  return d.toISOString().slice(0, 16);
}

export default async function SettingsPage() {
  await requireAdmin();
  const { t } = await getT();
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("key,value").in("key", ["opening_ceremony", "closing_ceremony"]);
  const value = (key: string) => (data?.find((r) => r.key === key)?.value ?? {}) as { at?: string; label_en?: string; label_tr?: string };
  const forms = [
    { key: "opening_ceremony", title: t("admin.openingCeremony"), v: value("opening_ceremony") },
    { key: "closing_ceremony", title: t("admin.closingCeremony"), v: value("closing_ceremony") },
  ];
  return (
    <div className="stack">
      <PageHeader title={t("admin.settings")} />
      {forms.map(({ key, title, v }) => (
        <Card key={key} title={title}>
          <form action={saveCeremony} className="stack">
            <input type="hidden" name="key" value={key} />
            <div className="form-grid">
              <div className="field">
                <label htmlFor={`${key}-at`}>{t("admin.dateTime")}</label>
                <input id={`${key}-at`} name="at" type="datetime-local" className="input" defaultValue={toIstanbulLocal(v.at)} required />
              </div>
              <div className="field">
                <label htmlFor={`${key}-label_en`}>{t("admin.labelEn")}</label>
                <input id={`${key}-label_en`} name="label_en" className="input" defaultValue={v.label_en ?? ""} />
              </div>
              <div className="field">
                <label htmlFor={`${key}-label_tr`}>{t("admin.labelTr")}</label>
                <input id={`${key}-label_tr`} name="label_tr" className="input" defaultValue={v.label_tr ?? ""} />
              </div>
            </div>
            <div><button className="btn btn-primary">{t("common.save")}</button></div>
          </form>
        </Card>
      ))}
      <p className="hint">{t("admin.ceremonyHint")}</p>
    </div>
  );
}
