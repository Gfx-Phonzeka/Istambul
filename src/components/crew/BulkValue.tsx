"use client";
import { useState } from "react";

type Opt = { value: string; label: string };
/** Picks what to change and shows the matching value field. */
export function BulkValue({ L, teams, functions, types, dayTypes }: { L: Record<string, string>; teams: Opt[]; functions: Opt[]; types: Opt[]; dayTypes: Opt[] }) {
  const [op, setOp] = useState("days");
  const opts = op.startsWith("team") ? teams : op === "function" ? functions : op === "type" ? types : op === "days" ? dayTypes : null;
  return (
    <>
      <select name="op" className="input" value={op} onChange={(e) => setOp(e.target.value)} aria-label={L.op}>
        {["days", "days_clear", "team_add", "team_remove", "function", "type", "company", "mediagest_on", "mediagest_off"].map((o) => <option key={o} value={o}>{L[`op_${o}`]}</option>)}
      </select>
      {opts ? (
        <select name="value" className="input" aria-label={L.value} required>{opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
      ) : op === "company" ? <input name="value" className="input" placeholder={L.company} aria-label={L.company} /> : null}
      {op.startsWith("days") && (
        <>
          <label className="crew-inline">{L.from} <input name="from" type="date" className="input" required /></label>
          <label className="crew-inline">{L.to} <input name="to" type="date" className="input" /></label>
        </>
      )}
    </>
  );
}
