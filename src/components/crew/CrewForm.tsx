"use client";
import { startTransition, useActionState, type FormEvent, type ReactNode } from "react";
import type { FormState } from "@/lib/actions/auth";

/** Small form for Crew Ops server actions: keeps the values on screen and shows "saved" or the error. */
export function CrewForm({ action, children, saved, error, className = "crew-filters", resetOnOk = false }: {
  action: (s: FormState, f: FormData) => Promise<FormState>; children: ReactNode; saved: string; error: string; className?: string; resetOnOk?: boolean;
}) {
  const [state, run, pending] = useActionState(action, undefined);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const el = e.currentTarget; const fd = new FormData(el);
    startTransition(async () => { await run(fd); if (resetOnOk) el.reset(); });
  };
  return (
    <form onSubmit={submit} className={className} aria-busy={pending}>
      {children}
      {state?.ok && <span className="small" role="status" style={{ color: "var(--color-success, #1a7f4b)" }}>{saved}</span>}
      {state?.error && <span className="small" role="alert" style={{ color: "var(--color-danger)" }}>{error}</span>}
    </form>
  );
}
