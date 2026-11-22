import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { formatDateTime } from "@/lib/format";
import { retryEmails } from "@/lib/actions/admin";
import { Badge, EmptyState, PageHeader, Alert } from "@/components/ui";

export const metadata = { title: "Email log" };

export default async function EmailsPage() {
  await requireAdmin();
  const { t, locale } = await getT();
  const supabase = await createClient();
  const { data } = await supabase.from("email_outbox").select("*").order("created_at", { ascending: false }).limit(100);
  const rows = data ?? [];
  const configured = Boolean(process.env.RESEND_API_KEY);
  const tone = (s: string) => (s === "sent" ? "success" : s === "failed" ? "danger" : s === "not_configured" ? "warning" : "info") as "success" | "danger" | "warning" | "info";
  return (
    <div className="stack">
      <PageHeader title={t("admin.emails")} actions={<form action={retryEmails}><button className="btn btn-sm">↻</button></form>} />
      {!configured && <Alert tone="warning">{t("admin.emailNotConfigured")}</Alert>}
      {rows.length === 0 ? (
        <div className="card"><EmptyState icon="mail">—</EmptyState></div>
      ) : (
        <div className="stack-sm">
          {rows.map((r) => (
            <details key={r.id} className="card" style={{ padding: "var(--space-3) var(--space-4)" }}>
              <summary className="row-between" style={{ cursor: "pointer" }}>
                <span>
                  <strong>{r.subject}</strong>
                  <span className="muted small"> → {r.to_email} · {formatDateTime(r.created_at, locale)}</span>
                </span>
                <Badge tone={tone(r.status)}>{t(`admin.emailStatuses.${r.status}`)}</Badge>
              </summary>
              <div className="pre" style={{ marginTop: "var(--space-3)" }}>{r.body_text}</div>
              {r.error && <p className="small" style={{ color: "var(--color-danger)" }}>{r.error}</p>}
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
