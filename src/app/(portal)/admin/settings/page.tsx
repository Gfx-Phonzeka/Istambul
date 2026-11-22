import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { saveOpeningCeremony } from "@/lib/actions/admin";
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
  const { data } = await supabase.from("settings").select("value").eq("key", "opening_ceremony").maybeSingle();
  const v = (data?.value ?? {}) as { at?: string; label_en?: string; label_tr?: string };
  return (
    <div className="stack">
      <PageHeader title={t("admin.settings")} />
      <Card title={t("admin.openingCeremony")}>
        <form action={saveOpeningCeremony} className="stack">
          <div className="form-grid">
            <div className="field">
              <label htmlFor="at">{t("admin.dateTime")}</label>
              <input id="at" name="at" type="datetime-local" className="input" defaultValue={toIstanbulLocal(v.at)} required />
            </div>
            <div className="field">
              <label htmlFor="label_en">{t("admin.labelEn")}</label>
              <input id="label_en" name="label_en" className="input" defaultValue={v.label_en ?? ""} />
            </div>
            <div className="field">
              <label htmlFor="label_tr">{t("admin.labelTr")}</label>
              <input id="label_tr" name="label_tr" className="input" defaultValue={v.label_tr ?? ""} />
            </div>
          </div>
          <div><button className="btn btn-primary">{t("common.save")}</button></div>
        </form>
      </Card>
    </div>
  );
}
