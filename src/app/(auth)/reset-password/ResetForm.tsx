"use client";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { completePasswordReset } from "@/lib/actions/auth";
import { useI18n } from "@/lib/i18n/client";
import { FieldError, FormError } from "@/components/FormMessage";

export function ResetForm({ token }: { token: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [state, action, pending] = useActionState(completePasswordReset, undefined);
  useEffect(() => {
    if (state?.ok) router.push("/login?reset=1");
  }, [state, router]);
  return (
    <form action={action} className="stack">
      <h1>{t("auth.resetTitle")}</h1>
      <FormError state={state} />
      <input type="hidden" name="token" value={token} />
      <div className="field">
        <label htmlFor="password">{t("auth.newPassword")}</label>
        <input id="password" name="password" type="password" className="input" autoComplete="new-password" required minLength={10}
          pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}" title={t("auth.passwordRules")} />
        <span className="hint">{t("auth.passwordRules")}</span>
        <FieldError state={state} name="password" />
      </div>
      <div className="field">
        <label htmlFor="password_confirm">{t("auth.confirmPassword")}</label>
        <input id="password_confirm" name="password_confirm" type="password" className="input" autoComplete="new-password" required />
        <FieldError state={state} name="password_confirm" />
      </div>
      <button className="btn btn-primary btn-block" disabled={pending}>{pending ? t("common.saving") : t("auth.setPassword")}</button>
    </form>
  );
}
