"use client";
import { useCallback } from "react";
import { useSearchParams } from "next/navigation";

/**
 * State kept in the URL query string, so filters and views can be shared, bookmarked and
 * restored with Back. Uses history.replaceState (no server round trip); Next keeps
 * useSearchParams in sync. The default value is not written to the URL.
 */
export function useUrlState(key: string, fallback: string): [string, (v: string) => void] {
  const sp = useSearchParams();
  const value = sp.get(key) ?? fallback;
  const set = useCallback((v: string) => {
    const p = new URLSearchParams(window.location.search);
    if (v === fallback || v === "") p.delete(key); else p.set(key, v);
    const qs = p.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
  }, [key, fallback]);
  return [value, set];
}

/** Boolean flag kept in the URL ("1" when on). */
export function useUrlFlag(key: string): [boolean, (v: boolean) => void] {
  const [v, set] = useUrlState(key, "");
  return [v === "1", useCallback((b: boolean) => set(b ? "1" : ""), [set])];
}
