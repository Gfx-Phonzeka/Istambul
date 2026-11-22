"use client";
import { useState, type ReactNode } from "react";
import { useUrlState } from "@/lib/hooks/useUrlState";

export interface FilterItem { id: string; group?: string; text: string; node: ReactNode }

/** Client-side search over a list of pre-rendered items, optionally grouped. */
export function FilterList({ items, groups, placeholder, noMatch, emptyText }: {
  items: FilterItem[]; groups?: { id: string; title: string }[]; placeholder: string; noMatch: string; emptyText: string;
}) {
  const [q, setQ] = useUrlState("q", "");
  const term = q.trim().toLocaleLowerCase();
  const visible = term ? items.filter((i) => i.text.toLocaleLowerCase().includes(term)) : items;
  if (items.length === 0) return <div className="card empty">{emptyText}</div>;
  return (
    <div className="stack">
      <input className="input" type="search" autoComplete="off" placeholder={placeholder} value={q} onChange={(e) => setQ(e.target.value)} aria-label={placeholder} />
      {visible.length === 0 && <div className="card empty">{noMatch}</div>}
      {groups
        ? groups.map((g) => {
            const gi = visible.filter((i) => i.group === g.id);
            if (gi.length === 0) return null;
            return (
              <section key={g.id} className="stack-sm">
                <h2>{g.title}</h2>
                {gi.map((i) => <div key={i.id}>{i.node}</div>)}
              </section>
            );
          })
        : <div className="stack-sm">{visible.map((i) => <div key={i.id}>{i.node}</div>)}</div>}
    </div>
  );
}
