import "server-only";
import { createClient } from "@/lib/supabase/server";

interface OutboxRow {
  id: number;
  to_email: string;
  subject: string;
  body_text: string;
}

/**
 * Delivers queued emails. Emails are created by database functions (registration,
 * approval, password reset…) and kept in the "email_outbox" table. When RESEND_API_KEY
 * is not configured, they are marked "not_configured" and stay visible in the backoffice.
 */
export async function flushEmails(): Promise<void> {
  const secret = process.env.EMAIL_DISPATCH_SECRET;
  if (!secret) return;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("claim_queued_emails", { p_secret: secret });
    if (error || !data) return;
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM || "Istanbul 2027 Portal <onboarding@resend.dev>";
    for (const row of data as OutboxRow[]) {
      if (!apiKey) {
        await supabase.rpc("mark_email_result", { p_secret: secret, p_id: row.id, p_status: "not_configured" });
        continue;
      }
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from, to: [row.to_email], subject: row.subject, text: row.body_text }),
        });
        const ok = res.ok;
        await supabase.rpc("mark_email_result", {
          p_secret: secret,
          p_id: row.id,
          p_status: ok ? "sent" : "failed",
          p_error: ok ? null : `HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`,
        });
      } catch (e) {
        await supabase.rpc("mark_email_result", {
          p_secret: secret,
          p_id: row.id,
          p_status: "failed",
          p_error: String(e).slice(0, 300),
        });
      }
    }
  } catch {
    // Email delivery must never break the user action that triggered it.
  }
}
