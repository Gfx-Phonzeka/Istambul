"use client";
import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions/auth";
import { useI18n } from "@/lib/i18n/client";

export function ForgotForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);
  return (
    <form action={action} className="stack">
      <div>
        <h1>{t("auth.forgotTitle")}</h1>
        <p className="muted">{t("auth.forgotText")}</p>
      </div>
      {state?.ok ? (
        <div className="alert alert-success">{t("auth.forgotSent")}</div>
      ) : (
        <>
          <div className="field">
            <label htmlFor="email">{t("auth.email")}</label>
            <input id="email" name="email" type="email" className="input" autoComplete="email" required />
          </div>
          <button className="btn btn-primary btn-block" disabled={pending}>{pending ? t("common.loading") : t("auth.sendLink")}</button>
        </>
      )}
      <Link href="/login" className="small">← {t("auth.signIn")}</Link>
    </form>
  );
}
