import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { requireCrewFinance } from "@/lib/crew-server";
import { getT } from "@/lib/i18n/server";
import { crewLabels } from "@/lib/crew";
import { loadCrew } from "@/lib/crew-data";
import { loadPlan } from "@/lib/crew-days";
import { loadLogistics } from "@/lib/crew-logistics";
import { loadFinance, personCost } from "@/lib/crew-costs";
import { addOtherCost, addService, deleteOtherCost, deleteService, savePerDiem, setHotelRate, setTravelCost } from "@/lib/actions/crew";
import { Badge, Card, PageHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { CrewTabs } from "@/components/crew/CrewTabs";
import { CrewForm } from "@/components/crew/CrewForm";

export const metadata = { title: "Crew Ops · Costs" };
const ROOMS = ["single", "double", "twin", "triple", "other"] as const;

export default async function CrewCostsPage() {
  const me = await requireCrewFinance();
  const { locale } = await getT();
  const c = crewLabels(locale);
  const eur = (n: number) => n.toLocaleString(locale, { style: "currency", currency: "EUR" });
  const [{ people }, plan, logi, fd] = await Promise.all([loadCrew(locale), loadPlan(), loadLogistics(), loadFinance()]);
  const costs = people.map((p) => personCost(p, plan, fd, logi.travels, logi.stays)).filter((x) => x.days > 0 || x.total !== 0 || fd.finance.has(x.person.id));
  const P = new Map(people.map((p) => [p.id, p]));
  const sum = (k: "fee" | "perDiem" | "travel" | "hotel" | "other" | "adjustment" | "total") => costs.reduce((s, x) => s + x[k], 0);
  const services = fd.services.reduce((s, x) => s + Number(x.amount), 0);
  const generalOther = fd.other.filter((o) => !o.profile_id).reduce((s, o) => s + Number(o.amount), 0);
  const byType = new Map<string, number>();
  for (const x of costs) byType.set(x.basis, (byType.get(x.basis) ?? 0) + x.total);
  const byCompany = new Map<string, number>();
  for (const x of costs.filter((x) => x.basis === "company")) byCompany.set(x.payee, (byCompany.get(x.payee) ?? 0) + x.fee);
  for (const s of fd.services) byCompany.set(s.company, (byCompany.get(s.company) ?? 0) + Number(s.amount));
  const pd = fd.perDiem;
  return (
    <div className="stack">
      <PageHeader title={c("crewOps")} subtitle={c("costsIntro")} actions={<a className="btn btn-sm" href="/api/crew/export?kind=costs">{c("exportCosts")}</a>} />
      <CrewTabs active="costs" c={c} admin={isAdmin(me)} />

      <Card title={c("summary")}>
        <div className="crew-summary">
          <div><span>{c("fee")}</span><strong>{eur(sum("fee"))}</strong></div>
          <div><span>{c("perDiem")}</span><strong>{eur(sum("perDiem"))}</strong></div>
          <div><span>{c("travelCost")}</span><strong>{eur(sum("travel"))}</strong></div>
          <div><span>{c("hotelCost")}</span><strong>{eur(sum("hotel"))}</strong></div>
          <div><span>{c("otherCost")}</span><strong>{eur(sum("other") + sum("adjustment") + generalOther)}</strong></div>
          <div><span>{c("services")}</span><strong>{eur(services)}</strong></div>
          <div className="crew-summary-total"><span>{c("grandTotal")}</span><strong>{eur(sum("total") + services + generalOther)}</strong></div>
        </div>
        <div className="crew-two">
          <div><h3>{c("byType")}</h3><ul className="crew-plain">{[...byType].map(([k, v]) => <li key={k}><span>{c(`basis_${k}`)}</span><strong>{eur(v)}</strong></li>)}</ul></div>
          <div><h3>{c("byCompany")}</h3><ul className="crew-plain">{[...byCompany].map(([k, v]) => <li key={k}><span>{k}</span><strong>{eur(v)}</strong></li>)}</ul></div>
        </div>
      </Card>

      <Card title={c("people")}>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>{c("name")}</th><th>{c("basis")}</th><th>{c("days")}</th><th>{c("fee")}</th><th>{c("perDiem")}</th><th>{c("travelCost")}</th><th>{c("hotelCost")}</th><th>{c("otherCost")}</th><th>{c("totalCost")}</th><th>{c("payee")}</th></tr></thead>
            <tbody>
              {costs.map((x) => (
                <tr key={x.person.id}>
                  <td><Link href={`/team/crew/${x.person.id}#finance`}><strong>{x.person.first_name} {x.person.last_name}</strong></Link><div className="muted small">{x.person.functionName ?? ""}</div></td>
                  <td className="small">{c(`basis_${x.basis}`)}{x.missingRate ? <div><Badge tone="warning">{c("missingRate")}</Badge></div> : null}</td>
                  <td className="small">{x.days}{x.standbyDays ? <span className="muted"> ({x.standbyDays} OFF*)</span> : null}</td>
                  <td className="small">{eur(x.fee)}</td><td className="small">{eur(x.perDiem)}</td><td className="small">{eur(x.travel)}</td><td className="small">{eur(x.hotel)}</td>
                  <td className="small">{eur(x.other + x.adjustment)}</td><td><strong>{eur(x.total)}</strong></td><td className="small">{x.payee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title={c("perDiemSettings")}>
        <CrewForm action={savePerDiem} saved={c("saved")} error={c("error")} className="stack-sm">
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th /><th>{c("meal")}</th><th>{c("breakfastAmount")}</th><th>{c("extraAmount")}</th></tr></thead>
              <tbody>
                {(["intl", "es", "pt"] as const).map((z) => (
                  <tr key={z}>
                    <td>{c(`zone_${z}`)}</td>
                    {(["meal", "breakfast", "extra"] as const).map((k) => (
                      <td key={k}><input name={`${z}_${k}`} className="input" inputMode="decimal" defaultValue={pd[z]?.[k] ?? ""} placeholder="[A CONFIRMAR]" aria-label={`${c(`zone_${z}`)} ${k}`} style={{ maxWidth: 140 }} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div><button className="btn btn-sm btn-primary">{c("setRate")}</button></div>
        </CrewForm>
      </Card>

      <Card title={c("travelCosts")}>
        {logi.travels.length === 0 ? <p className="muted" style={{ margin: 0 }}>{c("noTravel")}</p> : (
          <div className="stack-sm">
            {logi.travels.map((t) => {
              const p = P.get(t.profile_id);
              return (
                <CrewForm key={t.id} action={setTravelCost} saved="✓" error={c("error")}>
                  <input type="hidden" name="travel_id" value={t.id} />
                  <span className="small" style={{ minWidth: 280 }}><strong>{p ? `${p.first_name} ${p.last_name}` : "—"}</strong> · {t.depart_date} · {[t.carrier, t.number].filter(Boolean).join(" ")} {t.from_place ?? ""}→{t.to_place ?? ""}</span>
                  <input name="amount" className="input" inputMode="decimal" defaultValue={fd.travelCosts.get(t.id) ?? ""} placeholder={c("amount")} aria-label={c("amount")} style={{ maxWidth: 140 }} />
                  <button className="btn btn-sm">{c("setRate")}</button>
                </CrewForm>
              );
            })}
          </div>
        )}
      </Card>

      <Card title={c("hotelRates")}>
        {logi.hotels.length === 0 ? <p className="muted" style={{ margin: 0 }}>{c("noStays")}</p> : logi.hotels.map((h) => (
          <div key={h.id} className="stack-sm" style={{ marginBottom: 12 }}>
            <strong>{h.name}</strong>
            <div className="crew-filters">
              {ROOMS.map((r) => (
                <CrewForm key={r} action={setHotelRate} saved="✓" error="!" className="crew-inline">
                  <input type="hidden" name="hotel_id" value={h.id} /><input type="hidden" name="room_type" value={r} />
                  <span className="small">{c(`room_${r}`)}</span>
                  <input name="night_rate" className="input" inputMode="decimal" defaultValue={fd.hotelRates.get(`${h.id}|${r}`) ?? ""} aria-label={`${h.name} ${r}`} style={{ maxWidth: 100 }} />
                  <button className="btn btn-sm">{c("setRate")}</button>
                </CrewForm>
              ))}
            </div>
          </div>
        ))}
      </Card>

      <Card title={c("services")}>
        <CrewForm action={addService} saved={c("saved")} error={c("error")}>
          <input name="company" className="input" placeholder={c("company")} aria-label={c("company")} required maxLength={120} />
          <input name="description" className="input" placeholder={c("description")} aria-label={c("description")} maxLength={300} />
          <input name="amount" className="input" inputMode="decimal" placeholder={c("amount")} aria-label={c("amount")} required style={{ maxWidth: 140 }} />
          <button className="btn btn-sm btn-primary">{c("addService")}</button>
        </CrewForm>
        {fd.services.length > 0 && (
          <ul className="crew-plain" style={{ marginTop: 12 }}>
            {fd.services.map((s) => (
              <li key={s.id}><span><strong>{s.company}</strong>{s.description ? ` · ${s.description}` : ""}</span>
                <span className="row" style={{ gap: 8 }}><strong>{eur(Number(s.amount))}</strong><ConfirmButton className="btn btn-sm" message={c("remove")} confirmLabel={c("remove")} onConfirm={deleteService.bind(null, s.id)}>{c("remove")}</ConfirmButton></span></li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={c("otherCosts")}>
        <CrewForm action={addOtherCost} saved={c("saved")} error={c("error")}>
          <select name="category" className="input" aria-label={c("description")}>{["transfer", "car", "shipping", "other"].map((k) => <option key={k} value={k}>{c(`cat_${k}`)}</option>)}</select>
          <select name="profile_id" className="input" aria-label={c("person")} defaultValue=""><option value="">{c("general")}</option>{people.map((p) => <option key={p.id} value={p.id}>{p.last_name}, {p.first_name}</option>)}</select>
          <input name="description" className="input" placeholder={c("description")} aria-label={c("description")} maxLength={300} />
          <input name="amount" className="input" inputMode="decimal" placeholder={c("amount")} aria-label={c("amount")} required style={{ maxWidth: 140 }} />
          <button className="btn btn-sm btn-primary">{c("addCost")}</button>
        </CrewForm>
        {fd.other.length > 0 && (
          <ul className="crew-plain" style={{ marginTop: 12 }}>
            {fd.other.map((o) => { const p = o.profile_id ? P.get(o.profile_id) : null; return (
              <li key={o.id}><span>{c(`cat_${o.category}`)} · {p ? `${p.first_name} ${p.last_name}` : c("general")}{o.description ? ` · ${o.description}` : ""}</span>
                <span className="row" style={{ gap: 8 }}><strong>{eur(Number(o.amount))}</strong><ConfirmButton className="btn btn-sm" message={c("remove")} confirmLabel={c("remove")} onConfirm={deleteOtherCost.bind(null, o.id)}>{c("remove")}</ConfirmButton></span></li>
            ); })}
          </ul>
        )}
      </Card>
    </div>
  );
}
