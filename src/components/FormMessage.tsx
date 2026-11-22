"use client";
import { useI18n } from "@/lib/i18n/client";
import type { FormState } from "@/lib/actions/auth";

export function FormError({ state }: { state: FormState }) {
  const { t } = useI18n();
  if (!state?.error) return null;
  return <div className="alert alert-danger" role="alert">{t(state.error, state.errorVars)}</div>;
}
