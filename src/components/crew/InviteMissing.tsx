"use client";
import { useState, useTransition } from "react";
import { inviteMissing } from "@/lib/actions/crew";

export function InviteMissing({ label, done }: { label: string; done: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <span className="row" style={{ gap: 8 }}>
      <button type="button" className="btn btn-sm btn-primary" disabled={pending}
        onClick={() => start(async () => { const r = await inviteMissing(); setMsg(done.replace("{n}", String(r.sent))); })}>{pending ? "…" : label}</button>
      {msg && <span className="small" role="status">{msg}</span>}
    </span>
  );
}
