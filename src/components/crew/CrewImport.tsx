"use client";
import { useState, useTransition } from "react";
import { importCrew, type CrewImportResult } from "@/lib/actions/crew";

export function CrewImport({ L }: { L: Record<string, string> }) {
  const [res, setRes] = useState<CrewImportResult | null>(null);
  const [pending, start] = useTransition();
  return (
    <form className="crew-filters" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); start(async () => setRes(await importCrew(fd))); }}>
      <a className="btn btn-sm" href="/api/crew/template">{L.downloadTemplate}</a>
      <input type="file" name="file" accept=".xlsx" required aria-label={L.importFile} />
      <button className="btn btn-sm btn-primary" disabled={pending}>{pending ? "…" : L.importFile}</button>
      {res && (res.ok ? (
        <div className="small" role="status" style={{ width: "100%" }}>
          {L.importDone.replace("{created}", String(res.created)).replace("{updated}", String(res.updated))}
          {res.problems.length > 0 && <details><summary>{L.importProblems} ({res.problems.length})</summary><ul>{res.problems.map((p, i) => <li key={i}>#{p.line} {p.email}: {p.problem}</li>)}</ul></details>}
        </div>
      ) : <span className="small" role="alert" style={{ color: "var(--color-danger)" }}>{L.error} ({res.error})</span>)}
    </form>
  );
}
