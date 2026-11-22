"use client";
import { useActionState } from "react";
import Link from "next/link";
import { register } from "@/lib/actions/auth";
import { useI18n } from "@/lib/i18n/client";
import { FieldError, FormError } from "@/components/FormMessage";
import { COUNTRIES } from "@/lib/countries";

export function RegisterForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(register, undefined);
  const field = (name: string, label: string, type = "text", auto?: string) => (
    <div className="field">
      <label htmlFor={name}>{label} *</label>
      <input id={name} name={name} type={type} className="input" autoComplete={auto} spellCheck={type === "email" ? false : undefined} required />
      <FieldError state={state} name={name} />
    </div>
  );
  return (
    <form action={action} className="stack">
      <div>
        <h1>{t("auth.registerTitle")}</h1>
        <p className="muted">{t("auth.registerSubtitle")}</p>
      </div>
      <FormError state={state} />
      <div className="form-grid">
        {field("first_name", t("auth.firstName"), "text", "given-name")}
        {field("last_name", t("auth.lastName"), "text", "family-name")}
        {field("email", t("auth.workEmail"), "email", "email")}
        {field("phone", t("auth.phone"), "tel", "tel")}
        {field("organization", t("auth.organization"), "text", "organization")}
        <div className="field">
          <label htmlFor="country">{t("auth.country")} *</label>
          <select id="country" name="country" className="select" autoComplete="country-name" required defaultValue="">
            <option value="" disabled>—</option>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="org_type">{t("auth.orgType")} *</label>
          <select id="org_type" name="org_type" className="select" required defaultValue="">
            <option value="" disabled>—</option>
            <option value="right_holder">{t("auth.orgTypes.right_holder")}</option>
            <option value="partner">{t("auth.orgTypes.partner")}</option>
            <option value="other">{t("auth.orgTypes.other")}</option>
          </select>
        </div>
        {field("job_title", t("auth.jobTitle"), "text", "organization-title")}
        <div className="field">
          <label htmlFor="password">{t("auth.password")} *</label>
          <input id="password" name="password" type="password" className="input" autoComplete="new-password" required minLength={10}
            pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}" title={t("auth.passwordRules")} />
          <span className="hint">{t("auth.passwordRules")}</span>
          <FieldError state={state} name="password" />
        </div>
        <div className="field">
          <label htmlFor="password_confirm">{t("auth.confirmPassword")} *</label>
          <input id="password_confirm" name="password_confirm" type="password" className="input" autoComplete="new-password" required />
          <FieldError state={state} name="password_confirm" />
        </div>
      </div>
      <label className="checkbox">
        <input type="checkbox" id="terms" name="terms" required />
        <span>
          {t("auth.acceptTermsBefore")} <Link href="/legal/terms" target="_blank">{t("auth.termsLink")}</Link> {t("auth.and")}{" "}
          <Link href="/legal/privacy" target="_blank">{t("auth.privacyLink")}</Link>. *
        </span>
      </label>
      <FieldError state={state} name="terms" />
      <button className="btn btn-primary btn-block" disabled={pending}>{pending ? t("common.sending") : t("auth.submitRegistration")}</button>
      <p className="small" style={{ textAlign: "center", margin: 0 }}>
        {t("auth.haveAccount")} <Link href="/login">{t("auth.signIn")}</Link>
      </p>
    </form>
  );
}
