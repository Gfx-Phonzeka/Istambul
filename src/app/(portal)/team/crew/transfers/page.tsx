import { isAdmin } from "@/lib/auth";
import { requireCrew } from "@/lib/crew-server";
import { getT } from "@/lib/i18n/server";
import { crewLabels } from "@/lib/crew";
import { loadCrew } from "@/lib/crew-data";
import { hotelOn, loadLogistics } from "@/lib/crew-logistics";
import { formatDate } from "@/lib/format";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { CrewTabs } from "@/components/crew/CrewTabs";

export const metadata = { title: "Crew Ops · Transfers" };

/** Arrivals and departures that need a transfer, by day, with the hotel of each person. Generated from the trips. */
export default async function CrewTransfersPage() {
  const me = await requireCrew();
  const { locale } = await getT();
  const c = crewLabels(locale);
  const [{ people }, { travels, hotels, stays }] = await Promise.all([loadCrew(locale), loadLogistics()]);
  const P = new Map(people.map((p) => [p.id, p]));
  const H = new Map(hotels.map((h) => [h.id, h.name]));
  type Row = { day: string; time: string; kind: "arrivals" | "departures"; t: (typeof travels)[number]; hotel: string };
  const rows: Row[] = [];
  for (const t of travels.filter((x) => x.transfer_needed)) {
    if (t.direction !== "return" && t.arrive_date) { const s = hotelOn(stays, t.profile_id, t.arrive_date); rows.push({ day: t.arrive_date, time: t.arrive_time ?? "", kind: "arrivals", t, hotel: s ? H.get(s.hotel_id) ?? "" : "" }); }
    if (t.direction !== "outbound") { const s = hotelOn(stays, t.profile_id, t.depart_date); rows.push({ day: t.depart_date, time: t.depart_time ?? "", kind: "departures", t, hotel: s ? H.get(s.hotel_id) ?? "" : "" }); }
  }
  rows.sort((a, b) => `${a.day}${a.time}`.localeCompare(`${b.day}${b.time}`));
  const days = [...new Set(rows.map((r) => r.day))];
  return (
    <div className="stack">
      <PageHeader title={c("crewOps")} subtitle={c("transfersIntro")} />
      <CrewTabs active="transfers" c={c} admin={isAdmin(me)} />
      <div><a className="btn btn-sm" href="/api/crew/export?kind=transfers">{c("exportTransfers")}</a></div>
      {days.length === 0 ? <Card><EmptyState icon="inbox">{c("noTransfers")}</EmptyState></Card> : days.map((d) => (
        <Card key={d} title={formatDate(`${d}T12:00:00Z`, locale, "UTC")}>
          {(["arrivals", "departures"] as const).map((k) => {
            const list = rows.filter((r) => r.day === d && r.kind === k);
            if (!list.length) return null;
            return (
              <div key={k} className="stack-sm" style={{ marginBottom: 12 }}>
                <strong>{c(k)} ({list.length})</strong>
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>{k === "arrivals" ? c("arrive") : c("depart")}</th><th>{c("person")}</th><th>{c("number")}</th><th>{c("fromPlace")} → {c("toPlace")}</th><th>{c("hotel")}</th></tr></thead>
                    <tbody>
                      {list.map((r, i) => {
                        const p = P.get(r.t.profile_id);
                        return (
                          <tr key={`${r.t.id}-${i}`}>
                            <td><strong>{r.time || "—"}</strong></td>
                            <td>{p ? `${p.first_name} ${p.last_name}` : "—"}{p?.phone ? <div className="muted small">{p.phone}</div> : null}</td>
                            <td className="small">{[r.t.carrier, r.t.number].filter(Boolean).join(" ") || c(`mode_${r.t.mode}`)}</td>
                            <td className="small">{r.t.from_place ?? "?"} → {r.t.to_place ?? "?"}</td>
                            <td className="small">{r.hotel || "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </Card>
      ))}
    </div>
  );
}
