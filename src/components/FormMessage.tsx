"use client";
import { useEffect } from "react";
import { useI18n } from "@/lib/i18n/client";
import type { FormState } from "@/lib/actions/auth";

/** Form-level error (only for errors that do not belong to a single field). */
export function FormError({ state }: { state: FormState }) {
  const { t } = useI18n();
  if (!state?.error || state.field) return null;
  return <div className="alert alert-danger" role="alert">{t(state.error, state.errorVars)}</div>;
}

/** Error shown next to its field; the field is focused when the error arrives. */
export function FieldError({ state, name }: { state: FormState; name: string }) {
  const { t } = useI18n();
  const active = Boolean(state?.error && state.field === name);
  useEffect(() => {
    if (!active) return;
    const el = document.getElementById(name) as HTMLInputElement | null;
    el?.setAttribute("aria-invalid", "true");
    el?.setAttribute("aria-describedby", `${name}-error`);
    el?.focus();
    return () => { el?.removeAttribute("aria-invalid"); el?.removeAttribute("aria-describedby"); };
  }, [active, name, state]);
  if (!active) return null;
  return <p className="field-error" id={`${name}-error`} role="alert">{t(state!.error!, state!.errorVars)}</p>;
}
