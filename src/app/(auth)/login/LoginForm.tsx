"use client";
import { useActionState } from "react";
import Link from "next/link";
import { signIn } from "@/lib/actions/auth";
import { useI18n } from "@/lib/i18n/client";
import { FormError } from "@/components/FormMessage";

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(signIn, undefined);
  return (
    <form action={action} className="stack">
      <div>
        <h1>{t("auth.loginTitle")}</h1>
        <p className="muted">{t("auth.loginSubtitle")}</p>
      </div>
      {notice && <div className="alert alert-success">{t(notice)}</div>}
      <FormError state={state} />
      <input type="hidden" name="next" value={next ?? "/"} />
      <div className="field">
        <label htmlFor="email">{t("auth.email")}</label>
        <input id="email" name="email" type="email" className="input" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">{t("auth.password")}</label>
        <input id="password" name="password" type="password" className="input" autoComplete="current-password" required />
      </div>
      <button className="btn btn-primary btn-block" disabled={pending}>{pending ? t("common.loading") : t("auth.signIn")}</button>
      <div className="row-between small">
        <Link href="/forgot-password">{t("auth.forgot")}</Link>
        <span>
          {t("auth.noAccount")} <Link href="/register">{t("auth.register")}</Link>
        </span>
      </div>
    </form>
  );
}
