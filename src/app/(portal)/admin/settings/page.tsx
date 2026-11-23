import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { saveCeremony } from "@/lib/actions/admin";
import { Card, PageHeader } from "@/components/ui";
import { EVENT, toEventLocalInput } from "@/lib/event";

export const metadata = { title: "Settings" };

const toIstanbulLocal = (iso: string | undefined) => toEventLocalInput(iso);

export default async function SettingsPage() {
  await requireAdmin();
  const { t } = await getT();
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("key,value").in("key", ["opening_ceremony", "closing_ceremony"]);
  const value = (key: string) => (data?.find((r) => r.key === key)?.value ?? {}) as { at?: string } & Record<string, string | undefined>;
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
                <input id={`${key}-at`} name="at" type="datetime-local" className="input" autoComplete="off" defaultValue={toIstanbulLocal(v.at)} required />
              </div>
              {EVENT.locales.map((l) => (
                <div key={l} className="field">
                  <label htmlFor={`${key}-label_${l}`}>{t("admin.labelEn").replace("EN", l.toUpperCase())}</label>
                  <input id={`${key}-label_${l}`} name={`label_${l}`} className="input" autoComplete="off" defaultValue={v[`label_${l}`] ?? ""} />
                </div>
              ))}
            </div>
            <div><button className="btn btn-primary">{t("common.save")}</button></div>
          </form>
        </Card>
      ))}
      <p className="hint">{t("admin.ceremonyHint")}</p>
    </div>
  );
}
