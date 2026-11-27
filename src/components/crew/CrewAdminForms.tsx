"use client";
import { useActionState, useEffect, useRef, useTransition } from "react";
import { addFunction, addTeam, setCrewAccess, toggleFunction } from "@/lib/actions/crew";
import { TEAM_KINDS } from "@/lib/crew";

function useResetOnOk(ok: boolean | undefined) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (ok) ref.current?.reset(); }, [ok]);
  return ref;
}

export function AddTeamForm({ L }: { L: Record<string, string> }) {
  const [state, action, pending] = useActionState(addTeam, undefined);
  const ref = useResetOnOk(state?.ok);
  return (
    <form ref={ref} action={action} className="crew-filters">
      <input name="name" className="input" placeholder={L.teamName} aria-label={L.teamName} required maxLength={120} />
      <select name="kind" className="input" aria-label={L.teamKind} defaultValue="operational">
        {TEAM_KINDS.map((k) => <option key={k} value={k}>{L[k] ?? k}</option>)}
      </select>
      <input name="notes" className="input" placeholder={L.notes} aria-label={L.notes} maxLength={500} />
      <button className="btn btn-sm btn-primary" disabled={pending}>{L.addTeam}</button>
      {state?.error && <span className="small" style={{ color: "var(--color-danger)" }} role="alert">{L.error}</span>}
    </form>
  );
}

export function AddFunctionForm({ L, areas }: { L: Record<string, string>; areas: string[] }) {
  const [state, action, pending] = useActionState(addFunction, undefined);
  const ref = useResetOnOk(state?.ok);
  return (
    <form ref={ref} action={action} className="crew-filters">
      <input name="area" className="input" list="crew-areas" placeholder={L.area} aria-label={L.area} required maxLength={80} />
      <datalist id="crew-areas">{areas.map((a) => <option key={a} value={a} />)}</datalist>
      <input name="name_en" className="input" placeholder={`${L.function} (EN)`} aria-label={`${L.function} (EN)`} required maxLength={120} />
      <input name="name_pt" className="input" placeholder={`${L.function} (PT)`} aria-label={`${L.function} (PT)`} maxLength={120} />
      <button className="btn btn-sm btn-primary" disabled={pending}>{L.addFunction}</button>
      {state?.error && <span className="small" style={{ color: "var(--color-danger)" }} role="alert">{L.error}</span>}
    </form>
  );
}

export function FunctionToggle({ id, active, label }: { id: string; active: boolean; label: string }) {
  const [pending, start] = useTransition();
  return (
    <label className="crew-check">
      <input type="checkbox" defaultChecked={active} disabled={pending} onChange={(e) => { const v = e.target.checked; start(() => toggleFunction(id, v)); }} /> {label}
    </label>
  );
}

export function AccessSelect({ id, level, L }: { id: string; level: string; L: Record<string, string> }) {
  const [pending, start] = useTransition();
  return (
    <select className="input" defaultValue={level} disabled={pending} aria-label={L.access}
      onChange={(e) => { const v = e.target.value as "coordination" | "finance" | "none"; start(() => setCrewAccess(id, v)); }}>
      <option value="none">{L.none}</option>
      <option value="coordination">{L.coordination}</option>
      <option value="finance">{L.finance}</option>
    </select>
  );
}
