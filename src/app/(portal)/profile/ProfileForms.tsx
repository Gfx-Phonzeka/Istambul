"use client";
import { useActionState, useRef } from "react";
import { changePassword, requestDeletion, updateProfile } from "@/lib/actions/profile";
import { useI18n } from "@/lib/i18n/client";
import { FormError } from "@/components/FormMessage";
import { COUNTRIES } from "@/lib/countries";
import { ConfirmButton } from "@/components/ui/ConfirmButton";

interface P {
  first_name: string; last_name: string; organization: string; country: string; job_title: string; phone: string;
  preferred_language: string; notify_email: boolean;
}

export function DetailsForm({ profile }: { profile: P }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(updateProfile, undefined);
  const input = (name: keyof P, label: string, type = "text") => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} className="input" defaultValue={String(profile[name])} required />
    </div>
  );
  return (
    <form action={action} className="stack">
      {state?.ok && <div className="alert alert-success">{t("profile.saved")}</div>}
      <FormError state={state} />
      <div className="form-grid">
        {input("first_name", t("auth.firstName"))}
        {input("last_name", t("auth.lastName"))}
        {input("organization", t("auth.organization"))}
        <div className="field">
          <label htmlFor="country">{t("auth.country")}</label>
          <select id="country" name="country" className="select" defaultValue={profile.country}>
            {!COUNTRIES.includes(profile.country) && <option value={profile.country}>{profile.country}</option>}
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {input("job_title", t("auth.jobTitle"))}
        {input("phone", t("auth.phone"), "tel")}
      </div>
      <h3 style={{ marginTop: "var(--space-3)" }}>{t("profile.preferences")}</h3>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="preferred_language">{t("profile.languagePref")}</label>
          <select id="preferred_language" name="preferred_language" className="select" defaultValue={profile.preferred_language}>
            <option value="en">English</option>
            <option value="tr">Türkçe</option>
          </select>
        </div>
      </div>
      <label className="checkbox">
        <input type="checkbox" name="notify_email" defaultChecked={profile.notify_email} />
        <span>{t("profile.notifyEmail")}</span>
      </label>
      <div><button className="btn btn-primary" disabled={pending}>{pending ? t("common.loading") : t("common.save")}</button></div>
    </form>
  );
}

export function PasswordForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(changePassword, undefined);
  return (
    <form action={action} className="stack">
      {state?.ok && <div className="alert alert-success">{t("profile.passwordChanged")}</div>}
      <FormError state={state} />
      <div className="form-grid">
        <div className="field">
          <label htmlFor="new_password">{t("auth.newPassword")}</label>
          <input id="new_password" name="password" type="password" className="input" autoComplete="new-password" required minLength={10}
            pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}" title={t("auth.passwordRules")} />
          <span className="hint">{t("auth.passwordRules")}</span>
        </div>
        <div className="field">
          <label htmlFor="new_password_confirm">{t("auth.confirmPassword")}</label>
          <input id="new_password_confirm" name="password_confirm" type="password" className="input" autoComplete="new-password" required />
        </div>
      </div>
      <div><button className="btn" disabled={pending}>{t("profile.changePassword")}</button></div>
    </form>
  );
}

export function DeletionButton() {
  const { t } = useI18n();
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={requestDeletion}>
      <ConfirmButton className="btn btn-danger" message={t("profile.deleteConfirm")} onConfirm={() => formRef.current?.requestSubmit()}>
        {t("profile.deleteRequest")}
      </ConfirmButton>
    </form>
  );
}
