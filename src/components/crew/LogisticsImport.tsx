"use client";
import { useState, useTransition } from "react";
import { importLogistics, type LogisticsImportResult } from "@/lib/actions/crew";

export function LogisticsImport({ kind, L }: { kind: "travel" | "rooming"; L: Record<string, string> }) {
  const [res, setRes] = useState<LogisticsImportResult | null>(null);
  const [pending, start] = useTransition();
  return (
    <form className="crew-filters" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); start(async () => setRes(await importLogistics(fd))); }}>
      <input type="hidden" name="kind" value={kind} />
      <a className="btn btn-sm" href={`/api/crew/template?kind=${kind}`}>{L.downloadTemplate}</a>
      <input type="file" name="file" accept=".xlsx" required aria-label={L.importFile} />
      <button className="btn btn-sm btn-primary" disabled={pending}>{pending ? "…" : L.importFile}</button>
      {res && (res.ok ? (
        <div className="small" role="status" style={{ width: "100%" }}>
          {L.importedN.replace("{n}", String(res.imported))}
          {res.problems.length > 0 && <details><summary>{L.importProblems} ({res.problems.length})</summary><ul>{res.problems.map((p, i) => <li key={i}>#{p.line}: {p.problem}</li>)}</ul></details>}
        </div>
      ) : <span className="small" role="alert" style={{ color: "var(--color-danger)" }}>{L.error} ({res.error})</span>)}
    </form>
  );
}
