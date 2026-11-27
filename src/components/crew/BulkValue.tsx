"use client";
import { useState } from "react";

type Opt = { value: string; label: string };
/** Picks what to change and shows the matching value field. */
export function BulkValue({ L, teams, functions, types }: { L: Record<string, string>; teams: Opt[]; functions: Opt[]; types: Opt[] }) {
  const [op, setOp] = useState("team_add");
  const opts = op.startsWith("team") ? teams : op === "function" ? functions : op === "type" ? types : null;
  return (
    <>
      <select name="op" className="input" value={op} onChange={(e) => setOp(e.target.value)} aria-label={L.op}>
        {["team_add", "team_remove", "function", "type", "company", "mediagest_on", "mediagest_off"].map((o) => <option key={o} value={o}>{L[`op_${o}`]}</option>)}
      </select>
      {opts ? (
        <select name="value" className="input" aria-label={L.value} required>{opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
      ) : op === "company" ? <input name="value" className="input" placeholder={L.company} aria-label={L.company} /> : null}
    </>
  );
}
