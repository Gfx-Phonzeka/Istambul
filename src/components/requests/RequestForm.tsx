"use client";
import { useActionState, useEffect, useRef } from "react";
import { createRequest } from "@/lib/actions/requests";
import { useI18n } from "@/lib/i18n/client";

export function RequestForm({ venues, sports, contact }: {
  venues: { id: string; title: string }[]; sports: { id: string; title: string }[]; contact: { name: string; email: string; phone: string };
}) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(createRequest, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) formRef.current?.reset(); }, [state]);
  return (
    <form ref={formRef} action={action} className="stack">
      {state?.ok && <div className="alert alert-success">{t("requests.sent", { ref: state.reference ?? "" })}</div>}
      {state?.error && <div className="alert alert-danger">{t(state.error)}</div>}
      <div className="form-grid">
        <div className="field">
          <label htmlFor="request_type">{t("requests.type")} *</label>
          <select id="request_type" name="request_type" className="select" required defaultValue="unilateral">
            {["unilateral", "additional_production", "other"].map((x) => <option key={x} value={x}>{t(`requests.types.${x}`)}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="venue_id">{t("schedule.venue")}</label>
          <select id="venue_id" name="venue_id" className="select" defaultValue="">
            <option value="">—</option>
            {venues.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="sport_id">{t("venues.sport")}</label>
          <select id="sport_id" name="sport_id" className="select" defaultValue="">
            <option value="">—</option>
            {sports.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="start_date">{t("requests.from")}</label>
          <input id="start_date" name="start_date" type="date" className="input" />
        </div>
        <div className="field">
          <label htmlFor="end_date">{t("requests.to")}</label>
          <input id="end_date" name="end_date" type="date" className="input" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="description">{t("requests.description")} *</label>
        <textarea id="description" name="description" className="textarea" rows={5} required minLength={10} placeholder={t("requests.descriptionHint")} />
      </div>
      <h3 style={{ margin: 0 }}>{t("requests.contact")}</h3>
      <div className="form-grid">
        <div className="field"><label htmlFor="contact_name">{t("cms.fields.name")} *</label><input id="contact_name" name="contact_name" className="input" required defaultValue={contact.name} /></div>
        <div className="field"><label htmlFor="contact_email">{t("common.email")} *</label><input id="contact_email" name="contact_email" type="email" className="input" required defaultValue={contact.email} /></div>
        <div className="field"><label htmlFor="contact_phone">{t("auth.phone")}</label><input id="contact_phone" name="contact_phone" type="tel" className="input" defaultValue={contact.phone} /></div>
      </div>
      <div><button className="btn btn-primary" disabled={pending}>{pending ? t("common.loading") : t("requests.submit")}</button></div>
    </form>
  );
}
