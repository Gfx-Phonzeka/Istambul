import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { REQUEST_STATUSES, STATUS_TONE } from "@/lib/requests";
import { Badge, EmptyState, PageHeader, Tabs } from "@/components/ui";

export const metadata = { title: "Service requests" };

export default async function AdminRequests({ searchParams }: { searchParams: Promise<{ status?: string; type?: string; venue?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const { t, locale } = await getT();
  const supabase = await createClient();
  let q = supabase.from("service_requests").select("*").order("created_at", { ascending: false });
  if (sp.status && (REQUEST_STATUSES as readonly string[]).includes(sp.status)) q = q.eq("status", sp.status);
  if (sp.type) q = q.eq("request_type", sp.type);
  if (sp.venue) q = q.eq("venue_id", sp.venue);
  const [{ data }, { data: profiles }, { data: venues }, { data: all }] = await Promise.all([
    q, supabase.from("profiles").select("id,first_name,last_name,organization"), supabase.from("venues").select("id,title_en,title_tr").order("title_en"),
    supabase.from("service_requests").select("status"),
  ]);
  const P = new Map((profiles ?? []).map((p) => [p.id, p]));
  const V = new Map((venues ?? []).map((v) => [v.id, pick(locale, v.title_en, v.title_tr)]));
  const count = (s?: string) => (all ?? []).filter((r) => !s || r.status === s).length;
  const href = (o: Record<string, string | undefined>) => "/admin/requests?" + new URLSearchParams(Object.entries({ ...sp, ...o }).filter(([, v]) => v) as [string, string][]).toString();
  return (
    <div className="stack">
      <PageHeader title={t("nav.requests")} />
      <Tabs items={[{ href: href({ status: undefined }), label: `${t("admin.tabs.all")} (${count()})`, active: !sp.status },
        ...REQUEST_STATUSES.map((s) => ({ href: href({ status: s }), label: `${t(`requests.status.${s}`)} (${count(s)})`, active: sp.status === s }))]} />
      <form className="row">
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        <select name="type" className="select" aria-label={t("requests.allTypes")} style={{ width: "auto" }} defaultValue={sp.type ?? ""}>
          <option value="">{t("requests.allTypes")}</option>
          {["unilateral", "additional_production", "other"].map((x) => <option key={x} value={x}>{t(`requests.types.${x}`)}</option>)}
        </select>
        <select name="venue" className="select" aria-label={t("schedule.allVenues")} style={{ width: "auto" }} defaultValue={sp.venue ?? ""}>
          <option value="">{t("schedule.allVenues")}</option>
          {[...V.entries()].map(([id, title]) => <option key={id} value={id}>{title}</option>)}
        </select>
        <button className="btn btn-sm">{t("common.search")}</button>
      </form>
      {(data ?? []).length === 0 ? <div className="card"><EmptyState icon="inbox" action={{ label: t("common.backToBackoffice"), href: "/admin" }}>{t("requests.none")}</EmptyState></div> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>{t("requests.reference")}</th><th>{t("requests.requester")}</th><th>{t("requests.type")}</th><th>{t("schedule.venue")}</th><th>{t("requests.dates")}</th><th>{t("common.status")}</th></tr></thead>
            <tbody>
              {(data ?? []).map((r) => {
                const p = P.get(r.user_id);
                return (
                  <tr key={r.id}>
                    <td><Link href={`/admin/requests/${r.id}`}><strong>{r.reference}</strong></Link><div className="muted small">{formatDate(r.created_at, locale)}</div></td>
                    <td>{p ? `${p.first_name} ${p.last_name}` : "—"}<div className="muted small">{p?.organization}</div></td>
                    <td>{t(`requests.types.${r.request_type}`)}</td>
                    <td>{r.venue_id ? V.get(r.venue_id) : "—"}</td>
                    <td className="small">{r.start_date ? `${formatDate(r.start_date, locale)}${r.end_date ? " – " + formatDate(r.end_date, locale) : ""}` : "—"}</td>
                    <td><Badge tone={STATUS_TONE[r.status as keyof typeof STATUS_TONE]}>{t(`requests.status.${r.status}`)}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
