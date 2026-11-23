import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { tx, cols } from "@/lib/i18n";
import { formatDate, formatDateTime } from "@/lib/format";
import { STATUS_TONE } from "@/lib/requests";
import { Badge, Card, PageHeader } from "@/components/ui";
import { RequestAdminControls } from "@/components/requests/RequestAdminControls";

export default async function AdminRequest({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { t, locale } = await getT();
  const supabase = await createClient();
  const { data: r } = await supabase.from("service_requests").select("*").eq("id", id).maybeSingle();
  if (!r) notFound();
  const [{ data: p }, { data: events }, { data: notes }, { data: v }, { data: s }] = await Promise.all([
    supabase.from("profiles").select("first_name,last_name,organization,country,email").eq("id", r.user_id).maybeSingle(),
    supabase.from("request_events").select("*").eq("request_id", id).order("created_at"),
    supabase.from("request_notes").select("*").eq("request_id", id).order("created_at", { ascending: false }),
    r.venue_id ? supabase.from("venues").select(`${cols("title")}` as "*").eq("id", r.venue_id).maybeSingle() : Promise.resolve({ data: null }),
    r.sport_id ? supabase.from("sports").select(`${cols("title")}` as "*").eq("id", r.sport_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  return (
    <div className="stack">
      <Link href="/admin/requests" className="small">← {t("nav.requests")}</Link>
      <PageHeader title={r.reference} subtitle={t(`requests.types.${r.request_type}`)} actions={<Badge tone={STATUS_TONE[r.status as keyof typeof STATUS_TONE]}>{t(`requests.status.${r.status}`)}</Badge>} />
      <div className="grid grid-2">
        <Card title={t("requests.details")}>
          <dl className="specs" style={{ fontSize: "var(--text-sm)", gap: "6px 16px" }}>
            <dt>{t("requests.requester")}</dt><dd>{p ? `${p.first_name} ${p.last_name} · ${p.organization} (${p.country})` : "—"}</dd>
            <dt>{t("schedule.venue")}</dt><dd>{v ? tx(v, "title", locale) : "—"}</dd>
            <dt>{t("venues.sport")}</dt><dd>{s ? tx(s, "title", locale) : "—"}</dd>
            <dt>{t("requests.dates")}</dt><dd>{r.start_date ? `${formatDate(r.start_date, locale)}${r.end_date ? " – " + formatDate(r.end_date, locale) : ""}` : "—"}</dd>
            <dt>{t("requests.contact")}</dt><dd>{r.contact_name} · <a href={`mailto:${r.contact_email}`}>{r.contact_email}</a>{r.contact_phone ? ` · ${r.contact_phone}` : ""}</dd>
            <dt>{t("admin.columns.registered")}</dt><dd>{formatDateTime(r.created_at, locale)}</dd>
          </dl>
          <p style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>{r.description}</p>
        </Card>
        <Card title={t("requests.history")}>
          <ol className="request-timeline small">
            {(events ?? []).map((e) => <li key={e.id}><strong>{t(`requests.status.${e.status}`)}</strong> · {formatDateTime(e.created_at, locale)}{e.message && <div>{e.message}</div>}</li>)}
          </ol>
        </Card>
      </div>
      <RequestAdminControls id={r.id} status={r.status} />
      {(notes ?? []).length > 0 && (
        <Card title={t("requests.admin.notes")}>
          <ul className="list">
            {(notes ?? []).map((n) => <li key={n.id}><div className="muted small">{n.author_email} · {formatDateTime(n.created_at, locale)}</div><div style={{ whiteSpace: "pre-wrap" }}>{n.body}</div></li>)}
          </ul>
        </Card>
      )}
    </div>
  );
}
