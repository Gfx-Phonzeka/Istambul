import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n";
import { requireApproved } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/format";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { RequestForm } from "@/components/requests/RequestForm";

export const metadata = { title: "Service requests" };
import { STATUS_TONE } from "@/lib/requests";

export default async function RequestsPage() {
  const me = await requireApproved();
  const { t, locale } = await getT();
  const supabase = await createClient();
  const [{ data: requests }, { data: venues }, { data: sports }] = await Promise.all([
    supabase.from("service_requests").select("*, request_events(status,message,created_at)").eq("user_id", me.id).order("created_at", { ascending: false }),
    supabase.from("venues").select("id,title_en,title_tr").eq("status", "published").order("title_en"),
    supabase.from("sports").select("id,title_en,title_tr").eq("status", "published").order("position"),
  ]);
  const V = new Map((venues ?? []).map((v) => [v.id, pick(locale, v.title_en, v.title_tr)]));
  const S = new Map((sports ?? []).map((s) => [s.id, pick(locale, s.title_en, s.title_tr)]));
  return (
    <div className="stack">
      <PageHeader title={t("nav.requests")} subtitle={t("requests.subtitle")} />
      <Card title={t("requests.new")} className="anchor-target" id="new-request">
        <RequestForm
          venues={[...V.entries()].map(([id, title]) => ({ id, title }))}
          sports={[...S.entries()].map(([id, title]) => ({ id, title }))}
          contact={{ name: `${me.first_name} ${me.last_name}`, email: me.email, phone: me.phone }}
        />
      </Card>
      <section className="stack-sm">
        <h2>{t("requests.mine")}</h2>
        {(requests ?? []).length === 0 ? <Card><EmptyState icon="inbox" action={{ label: t("common.fillRequestForm"), href: "#new-request" }}>{t("requests.none")}</EmptyState></Card> : (
          (requests ?? []).map((r) => (
            <article key={r.id} id={r.reference} className="card stack-sm">
              <div className="row-between">
                <div className="row"><strong>{r.reference}</strong><span className="muted small">{t(`requests.types.${r.request_type}`)} · {formatDate(r.created_at, locale)}</span></div>
                <Badge tone={STATUS_TONE[r.status as keyof typeof STATUS_TONE]}>{t(`requests.status.${r.status}`)}</Badge>
              </div>
              <div className="small muted">
                {[r.venue_id && V.get(r.venue_id), r.sport_id && S.get(r.sport_id), r.start_date && `${formatDate(r.start_date, locale)}${r.end_date ? " – " + formatDate(r.end_date, locale) : ""}`].filter(Boolean).join(" · ")}
              </div>
              <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{r.description}</p>
              <ol className="request-timeline small">
                {[...(r.request_events ?? [])].sort((a: { created_at: string }, b: { created_at: string }) => a.created_at.localeCompare(b.created_at)).map((e: { status: string; message: string | null; created_at: string }, i: number) => (
                  <li key={i}><strong>{t(`requests.status.${e.status}`)}</strong> · {formatDateTime(e.created_at, locale)}{e.message && <div>{e.message}</div>}</li>
                ))}
              </ol>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
