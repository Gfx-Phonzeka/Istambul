import type { Profile } from "@/lib/auth";

// Daily reports and PQC reports: who can do what (mirrors the database rules in 0016_daily_reports.sql).
const fn = (p: Profile | null) => (p?.role === "production" ? (p.team_function ?? "").trim().toLowerCase() : "");

export function reportsAccess(p: Profile | null) {
  const admin = p?.role === "admin";
  const staff = p?.role === "editor" || admin;
  const write = admin || ["producer", "director"].includes(fn(p));
  const read = staff || fn(p) === "production coordinator";
  const pqc = read || fn(p).startsWith("production quality control");
  return { write, read, pqc, admin, any: write || read || pqc };
}

export interface ReportFile { path: string; name: string; size: number }

export const REPORT_MAX_BYTES = 50 * 1024 * 1024;

/** Today in the event's local time zone (YYYY-MM-DD). */
export function todayIn(tz: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export const isDay = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

export const fileHref = (f: { path: string; name: string }) => `/api/reports/file?path=${encodeURIComponent(f.path)}&name=${encodeURIComponent(f.name)}`;
