import { isAdmin } from "@/lib/auth";
import { requireCrew } from "@/lib/crew-server";
import { getT } from "@/lib/i18n/server";
import { crewLabels } from "@/lib/crew";
import { loadCrew } from "@/lib/crew-data";
import { loadLogistics } from "@/lib/crew-logistics";
import { addTravel, deleteTravel } from "@/lib/actions/crew";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { CrewTabs } from "@/components/crew/CrewTabs";
import { CrewForm } from "@/components/crew/CrewForm";
import { LogisticsImport } from "@/components/crew/LogisticsImport";
import { crewDict } from "@/lib/crew";

export const metadata = { title: "Crew Ops · Travel" };

export default async function CrewTravelPage() {
  const me = await requireCrew();
  const { locale } = await getT();
  const c = crewLabels(locale);
  const [{ people }, { travels }] = await Promise.all([loadCrew(locale), loadLogistics()]);
  const P = new Map(people.map((p) => [p.id, p]));
  return (
    <div className="stack">
      <PageHeader title={c("crewOps")} subtitle={c("travelIntro")} />
      <CrewTabs active="travel" c={c} admin={isAdmin(me)} />
      <Card title={c("importTravel")}><LogisticsImport kind="travel" L={crewDict(locale)} /></Card>
      <Card title={c("addTravel")}>
        <CrewForm action={addTravel} saved={c("saved")} error={c("error")}>
          <select name="profile_id" className="input" required defaultValue="" aria-label={c("person")}>
            <option value="" disabled>{c("person")}</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.last_name}, {p.first_name}</option>)}
          </select>
          <select name="direction" className="input" aria-label={c("direction")}>{["outbound", "return", "internal"].map((d) => <option key={d} value={d}>{c(`dir_${d}`)}</option>)}</select>
          <select name="mode" className="input" aria-label={c("travelMode")}>{["flight", "train", "car", "bus", "other"].map((m) => <option key={m} value={m}>{c(`mode_${m}`)}</option>)}</select>
          <input name="carrier" className="input" placeholder={c("carrier")} aria-label={c("carrier")} maxLength={80} />
          <input name="number" className="input" placeholder={c("number")} aria-label={c("number")} maxLength={40} />
          <input name="from_place" className="input" placeholder={c("fromPlace")} aria-label={c("fromPlace")} maxLength={80} />
          <input name="to_place" className="input" placeholder={c("toPlace")} aria-label={c("toPlace")} maxLength={80} />
          <label className="crew-inline">{c("depart")} <input name="depart_date" type="date" className="input" required /><input name="depart_time" type="time" className="input" aria-label={c("depart")} /></label>
          <label className="crew-inline">{c("arrive")} <input name="arrive_date" type="date" className="input" /><input name="arrive_time" type="time" className="input" aria-label={c("arrive")} /></label>
          <input name="booking_ref" className="input" placeholder={c("bookingRef")} aria-label={c("bookingRef")} maxLength={40} />
          <input name="extras" className="input" placeholder={c("extras")} aria-label={c("extras")} maxLength={300} />
          <label className="crew-check"><input type="checkbox" name="transfer_needed" defaultChecked /> {c("transferNeeded")}</label>
          <button className="btn btn-sm btn-primary">{c("addTravel")}</button>
        </CrewForm>
      </Card>
      <Card title={`${c("tabTravel")} (${travels.length})`} actions={<a className="btn btn-sm" href="/api/crew/export?kind=travel">{c("exportTravel")}</a>}>
        {travels.length === 0 ? <EmptyState icon="inbox">{c("noTravel")}</EmptyState> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>{c("person")}</th><th>{c("direction")}</th><th>{c("number")}</th><th>{c("fromPlace")} → {c("toPlace")}</th><th>{c("depart")}</th><th>{c("arrive")}</th><th>{c("bookingRef")}</th><th /></tr></thead>
              <tbody>
                {travels.map((t) => {
                  const p = P.get(t.profile_id);
                  return (
                    <tr key={t.id}>
                      <td><strong>{p ? `${p.first_name} ${p.last_name}` : "—"}</strong>{p?.functionName ? <div className="muted small">{p.functionName}</div> : null}</td>
                      <td className="small">{c(`dir_${t.direction}`)} · {c(`mode_${t.mode}`)}{t.transfer_needed ? " 🚐" : ""}</td>
                      <td className="small">{[t.carrier, t.number].filter(Boolean).join(" ") || "—"}</td>
                      <td className="small">{t.from_place ?? "?"} → {t.to_place ?? "?"}</td>
                      <td className="small">{t.depart_date} {t.depart_time ?? ""}</td>
                      <td className="small">{t.arrive_date ?? ""} {t.arrive_time ?? ""}</td>
                      <td className="small">{t.booking_ref ?? ""}{t.extras ? <div className="muted">{t.extras}</div> : null}</td>
                      <td><ConfirmButton className="btn btn-sm" message={c("remove")} confirmLabel={c("remove")} onConfirm={deleteTravel.bind(null, t.id)}>{c("remove")}</ConfirmButton></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
