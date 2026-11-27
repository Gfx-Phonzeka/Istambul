import Link from "next/link";
import { requireTeam, isStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { tx, cols, DEFAULT_LOCALE } from "@/lib/i18n";
import { formatDate, formatDateTime } from "@/lib/format";
import { loadPlans } from "@/lib/venues";
import { signPaths } from "@/lib/media";
import { reportsAccess } from "@/lib/reports";
import { isCrewCoord } from "@/lib/crew-server";
import { Card, EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "My venue" };

const day = (d: string, locale: Parameters<typeof formatDate>[1]) => formatDate(`${d}T12:00:00Z`, locale, "UTC");
const wa = (phone: string | null) => (phone ? `https://wa.me/${phone.replace(/[^\d]/g, "")}` : null);

/** "My team, my venue": the producer's (and the team's) one-stop page for their venue. */
export default async function MyVenuePage({ searchParams }: { searchParams: Promise<{ venue?: string }> }) {
  const me = await requireTeam();
  const sp = await searchParams;
  const { t, locale } = await getT();
  const supabase = await createClient();
  const canPick = isStaff(me) || (await isCrewCoord());
  const { data: venues } = await supabase.from("venues").select(`id,slug,address,cluster_id,${cols("title")}` as "*").eq("status", "published").order(`title_${DEFAULT_LOCALE}`);
  const all = (venues ?? []) as unknown as { id: string; slug: string; address: string | null; cluster_id: string }[];
  const venueId = (canPick && sp.venue && all.some((v) => v.id === sp.venue) ? sp.venue : null) ?? me.team_venue_id ?? (canPick ? all[0]?.id : null);
  const v = all.find((x) => x.id === venueId);

  const picker = canPick && (
    <form method="get" className="row" style={{ gap: 8, flexWrap: "wrap" }}>
      <select name="venue" className="select" defaultValue={venueId ?? ""} aria-label={t("myVenue.choose")} style={{ maxWidth: 340 }}>
        {all.map((x) => <option key={x.id} value={x.id}>{tx(x, "title", locale)}</option>)}
      </select>
      <button className="btn btn-sm">{t("reports.show")}</button>
    </form>
  );
  if (!v) {
    return (
      <div className="stack">
        <PageHeader title={t("myVenue.title")} subtitle={t("myVenue.subtitle")} />
        <Card><EmptyState icon="pin">{t("myVenue.noVenue")}</EmptyState></Card>
      </div>
    );
  }

  const [{ data: cal }, { data: sports }, { data: sessions }, plans, { data: files }, { data: team }, { data: mediaDocs }] = await Promise.all([
    supabase.from("calendar_rows").select(`id,games,sport_id,${cols("label")},days` as "*").eq("venue_id", v.id).order("position"),
    supabase.from("sports").select(`id,${cols("title")}` as "*"),
    supabase.from("schedule_sessions").select(`id,sport_id,start_at,end_at,is_medal,${cols("phase")},${cols("discipline")}` as "*").eq("venue_id", v.id).eq("status", "published").order("start_at").limit(200),
    loadPlans(supabase, locale, false),
    supabase.from("venue_files").select("*").eq("venue_id", v.id).order("position"),
    supabase.rpc("my_venue_team", { p_venue: v.id }),
    supabase.from("media_assets").select(`id,sport_id,subtype,${cols("title")}` as "*").eq("venue_id", v.id).eq("status", "published").order("position"),
  ]);
  const S = new Map((sports ?? []).map((s) => [s.id, tx(s, "title", locale)]));
  const rows = (cal ?? []) as unknown as { id: string; games: string; sport_id: string | null; days: Record<string, string> }[];
  const myPlans = plans.filter((p) => p.venue_id === v.id);
  const photo = (files ?? []).find((f) => f.kind === "photo");
  const docs = (files ?? []).filter((f) => f.kind === "document");
  const photoUrl = photo ? (await signPaths(supabase, "venues", [photo.file_path]))[photo.file_path] : null;
  const ses = (sessions ?? []) as unknown as { id: string; sport_id: string; start_at: string; end_at: string; is_medal: boolean }[];
  type Member = { id: string; first_name: string; last_name: string; email: string; phone: string | null; team_function: string | null;
    function_en: string | null; function_es: string | null; function_pt: string | null; position_label: string | null; teams: string | null };
  const people = (team ?? []) as Member[];
  const fnName = (m: Member) => (locale === "pt" && m.function_pt) || (locale === "es" && m.function_es) || m.function_en || m.team_function || "—";
  const canReport = reportsAccess(me).write;

  return (
    <div className="stack">
      <PageHeader title={t("myVenue.title")} subtitle={t("myVenue.subtitle")} actions={picker || undefined} />

      <Card>
        <div className="myvenue-head">
          {photoUrl && <img src={photoUrl} alt="" className="myvenue-photo" />}
          <div className="stack-sm">
            <h2 style={{ margin: 0 }}>{tx(v, "title", locale)}</h2>
            {v.address && <div><span className="muted small">{t("myVenue.address")}: </span>{v.address}</div>}
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              <Link className="btn btn-sm" href={`/venues/${v.slug}`}>{t("myVenue.venuePage")}</Link>
              {canReport && <Link className="btn btn-sm btn-primary" href="/team/reports">{t("myVenue.openReport")}</Link>}
            </div>
          </div>
        </div>
      </Card>

      <Card title={t("myVenue.sessions")}>
        {rows.length === 0 && ses.length === 0 ? <p className="muted" style={{ margin: 0 }}>{t("myVenue.noSessions")}</p> : (
          <div className="stack-sm">
            {rows.map((r) => (
              <div key={r.id}>
                <strong>{r.sport_id ? S.get(r.sport_id) : tx(r, "label", locale)}</strong>
                <div className="myvenue-days">
                  {Object.entries(r.days ?? {}).sort().map(([d, code]) => (
                    <span key={d} className={`myvenue-day cal-${code}`} title={t(`schedule.calendar.legend.${code}`)}>{day(d, locale)}</span>
                  ))}
                </div>
              </div>
            ))}
            {ses.length > 0 && (
              <ul className="stack-sm" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {ses.map((s) => (
                  <li key={s.id} className="small">
                    <strong>{formatDateTime(s.start_at, locale)}</strong>–{formatDateTime(s.end_at, locale).split(" ").pop()} · {S.get(s.sport_id)}
                    {[tx(s, "discipline", locale), tx(s, "phase", locale)].filter(Boolean).map((x) => ` · ${x}`).join("")}{s.is_medal ? " 🏅" : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>

      <Card title={`${t("myVenue.cameraPlans")} (${myPlans.length})`}>
        {myPlans.length === 0 ? <p className="muted" style={{ margin: 0 }}>{t("cameraMaps.noneForVenue")}</p> : (
          <ul className="stack-sm" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {myPlans.map((p) => (
              <li key={p.id} className="row-between">
                <span><strong>{p.sportTitle}</strong>{p.title ? <span className="muted"> · {p.title}</span> : null}</span>
                <span className="muted small">{p.total} {t("cameraMaps.cameras")}</span>
              </li>
            ))}
            <li><Link href={`/venues/${v.slug}#camera-maps`}>{t("myVenue.openPlans")} →</Link></li>
          </ul>
        )}
      </Card>

      <Card title={`${t("myVenue.team")} (${people.length})`}>
        <p className="muted small" style={{ marginTop: 0 }}>{t("myVenue.teamHelp")}</p>
        {people.length === 0 ? <EmptyState icon="users">{t("myVenue.noTeam")}</EmptyState> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>{t("myVenue.function")}</th><th>{t("myVenue.name")}</th><th>{t("myVenue.contact")}</th></tr></thead>
              <tbody>
                {people.map((m) => (
                  <tr key={m.id}>
                    <td className="small">{fnName(m)}{m.position_label ? <div className="muted">{m.position_label}</div> : null}{m.teams ? <div className="muted">{m.teams}</div> : null}</td>
                    <td><strong>{m.first_name} {m.last_name}</strong>{m.id === me.id ? <span className="muted small"> ·  ✓</span> : null}</td>
                    <td className="small">
                      <a href={`mailto:${m.email}`}>{m.email}</a>
                      {m.phone && <div>{m.phone} · <a href={wa(m.phone)!} target="_blank" rel="noreferrer">{t("myVenue.whatsapp")}</a></div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted small" style={{ marginBottom: 0 }}><strong>{t("myVenue.daily")}:</strong> {t("myVenue.dailySoon")}</p>
      </Card>

      <Card title={t("myVenue.documents")}>
        {((mediaDocs ?? []) as unknown as { id: string; sport_id: string | null; subtype: string | null }[]).length > 0 && (
          <ul className="stack-sm" style={{ listStyle: "none", padding: 0, margin: "0 0 12px" }}>
            {((mediaDocs ?? []) as unknown as { id: string; sport_id: string | null; subtype: string | null }[]).map((d) => (
              <li key={d.id}>
                <Link href={`/media-hub?item=${d.id}`}>{tx(d, "title", locale)}</Link>
                <span className="muted small">{[d.subtype, d.sport_id && S.get(d.sport_id)].filter(Boolean).map((x) => ` · ${x}`).join("")}</span>
              </li>
            ))}
          </ul>
        )}
        {docs.length > 0 && (
          <ul className="stack-sm" style={{ listStyle: "none", padding: 0, margin: "0 0 12px" }}>
            {docs.map((d) => <li key={d.id}><Link href={`/venues/${v.slug}#documents`}>{tx(d, "title", locale) || d.file_name}</Link></li>)}
          </ul>
        )}
        <p className="muted small" style={{ margin: 0 }}>{t("myVenue.dcas")} <Link href="/media-hub?category=documents">{t("myVenue.openMedia")} →</Link></p>
      </Card>
    </div>
  );
}
