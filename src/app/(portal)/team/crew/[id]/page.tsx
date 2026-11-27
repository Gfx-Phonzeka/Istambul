import { isAdmin } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCrew, crewPhotoUrl, isCrewFinance } from "@/lib/crew-server";
import { loadFinance, defaultBasis } from "@/lib/crew-costs";
import { saveContact, saveFinance } from "@/lib/actions/crew";
import { loadLogistics, nights } from "@/lib/crew-logistics";
import { loadCrew } from "@/lib/crew-data";
import { getT } from "@/lib/i18n/server";
import { crewDict, crewLabels, type CrewRecord } from "@/lib/crew";
import { formatDateTime } from "@/lib/format";
import { Card, PageHeader } from "@/components/ui";
import { CrewSheetForm } from "@/components/crew/CrewSheetForm";
import { ParticipationForm } from "@/components/crew/ParticipationForm";
import { loadPlan, personDays } from "@/lib/crew-days";
import { venueSportNames } from "@/lib/crew-refs";
import { setPersonDays } from "@/lib/actions/crew";
import { CrewForm } from "@/components/crew/CrewForm";
import { PeriodFields } from "@/components/crew/DayFields";
import { DaysList } from "@/components/crew/DaysList";
import { formatDate } from "@/lib/format";

export default async function CrewPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireCrew();
  const { id } = await params;
  const { locale } = await getT();
  const c = crewLabels(locale);
  const [{ people, functions, teams, fname }, plan, { V, S }] = await Promise.all([loadCrew(locale), loadPlan(), venueSportNames(locale)]);
  const p = people.find((x) => x.id === id);
  if (!p) notFound();
  const L = crewDict(locale);
  const fin = (await isCrewFinance()) ? await loadFinance() : null;
  const f = fin?.finance.get(p.id);
  const logi = await loadLogistics();
  const trips = logi.travels.filter((x) => x.profile_id === p.id);
  const stays = logi.stays.filter((x) => x.profile_id === p.id);
  const HN = new Map(logi.hotels.map((h) => [h.id, h.name]));
  const days = [...personDays(plan, p.id).values()];
  const U = new Map(plan.units.map((u) => [u.id, u.code]));
  return (
    <div className="stack">
      <PageHeader title={`${p.first_name} ${p.last_name}`} subtitle={[p.email, p.phone, p.organization].filter(Boolean).join(" · ")}
        actions={<Link className="btn btn-sm" href="/team/crew">← {c("back")}</Link>} />
      {(p.role === "production" || isAdmin(me)) && (
        <Card title={c("contactTitle")}>
          <CrewForm action={saveContact} saved={c("saved")} error={c("error")}>
            <input type="hidden" name="profile_id" value={p.id} />
            <input name="first_name" className="input" defaultValue={p.first_name} aria-label={c("firstName")} placeholder={c("firstName")} required maxLength={100} />
            <input name="last_name" className="input" defaultValue={p.last_name} aria-label={c("lastName")} placeholder={c("lastName")} required maxLength={100} />
            <input name="phone" className="input" defaultValue={p.phone ?? ""} aria-label={c("emergency_phone")} placeholder={c("emergency_phone")} maxLength={50} />
            <input name="organization" className="input" defaultValue={p.organization ?? ""} aria-label={c("company")} placeholder={c("company")} maxLength={200} />
            <button className="btn btn-sm btn-primary">{c("save")}</button>
          </CrewForm>
          <p className="muted small" style={{ marginBottom: 0 }}>{c("emailNote")}</p>
        </Card>
      )}
      <Card title={c("participation")}>
        <ParticipationForm profileId={p.id} L={L}
          functions={functions.filter((f) => f.active || f.id === p.function_id).map((f) => ({ id: f.id, area: f.area, label: fname(f) ?? f.name_en }))}
          teams={teams.map((t) => ({ id: t.id, name: t.name, kind: t.kind }))}
          value={{ function_id: p.function_id, position_label: p.position_label, collaborator_type: p.collaborator_type, company: p.company, notes: p.notes, teamIds: p.teamIds, in_mediagest: p.in_mediagest }} />
      </Card>
      <Card title={`${c("personDays")} (${days.length})`}>
        <p className="muted small" style={{ marginTop: 0 }}>{c("personDaysHelp")}</p>
        {days.length > 0 && <DaysList days={days} c={c} U={U} V={V} S={S} fmt={(d) => formatDate(`${d}T12:00:00Z`, locale, "UTC")} />}
        <h3 style={{ marginBottom: 8 }}>{c("exception")}</h3>
        <CrewForm action={setPersonDays} saved={c("saved")} error={c("error")}>
          <input type="hidden" name="profile_id" value={p.id} />
          <PeriodFields c={c} extraTypes={["standby", "none", "auto"]} />
          <select name="unit_id" className="input" aria-label={c("unit")} defaultValue=""><option value="">{c("unit")}</option>{plan.units.map((u) => <option key={u.id} value={u.id}>{u.code}</option>)}</select>
          <input name="notes" className="input" placeholder={c("note")} aria-label={c("note")} maxLength={300} />
          <button className="btn btn-sm btn-primary">{c("apply")}</button>
        </CrewForm>
      </Card>
      <Card title={`${c("tabTravel")} · ${c("tabHotels")}`}>
        {trips.length === 0 && stays.length === 0 ? <p className="muted" style={{ margin: 0 }}>—</p> : (
          <ul className="crew-plain">
            {trips.map((t) => <li key={t.id}><span>{c(`dir_${t.direction}`)} · {[t.carrier, t.number].filter(Boolean).join(" ")} {t.from_place ?? ""} → {t.to_place ?? ""}</span><span className="small">{t.depart_date} {t.depart_time ?? ""}</span></li>)}
            {stays.map((st) => <li key={st.id}><span>{HN.get(st.hotel_id)} · {c(`room_${st.room_type}`)}{st.room_code ? ` (${st.room_code})` : ""}</span><span className="small">{st.check_in} → {st.check_out} · {nights(st.check_in, st.check_out)} {c("nights")}</span></li>)}
          </ul>
        )}
        <p className="small" style={{ marginBottom: 0 }}><Link href="/team/crew/travel">{c("tabTravel")}</Link> · <Link href="/team/crew/hotels">{c("tabHotels")}</Link></p>
      </Card>
      {fin && (
        <Card title={c("financeTitle")} id="finance">
          <CrewForm action={saveFinance} saved={c("saved")} error={c("error")} className="stack-sm">
            <input type="hidden" name="profile_id" value={p.id} />
            <div className="crew-grid">
              <div className="field"><label htmlFor="basis">{c("basis")}</label>
                <select id="basis" name="basis" className="input" defaultValue={f?.basis ?? defaultBasis(p)}>{["daily", "forfait", "per_diem_only", "company"].map((b) => <option key={b} value={b}>{c(`basis_${b}`)}</option>)}</select></div>
              <div className="field"><label htmlFor="daily_rate">{c("dailyRate")}</label><input id="daily_rate" name="daily_rate" className="input" inputMode="decimal" defaultValue={f?.daily_rate ?? ""} /></div>
              <div className="field"><label htmlFor="monthly_rate">{c("monthlyRate")}</label><input id="monthly_rate" name="monthly_rate" className="input" inputMode="decimal" defaultValue={f?.monthly_rate ?? ""} /></div>
              <div className="field"><label htmlFor="per_diem_zone">{c("perDiemZone")}</label>
                <select id="per_diem_zone" name="per_diem_zone" className="input" defaultValue={f?.per_diem_zone ?? "intl"}>{["intl", "es", "pt", "custom", "none"].map((z) => <option key={z} value={z}>{c(`zone_${z}`)}</option>)}</select></div>
              <div className="field"><label htmlFor="per_diem_custom">{c("perDiemCustom")}</label><input id="per_diem_custom" name="per_diem_custom" className="input" inputMode="decimal" defaultValue={f?.per_diem_custom ?? ""} /></div>
              <div className="field"><label htmlFor="extra_meals">{c("extraMeals")}</label><input id="extra_meals" name="extra_meals" type="number" min={0} className="input" defaultValue={f?.extra_meals ?? 0} /></div>
              <div className="field"><label htmlFor="adjustment">{c("adjustment")}</label><input id="adjustment" name="adjustment" className="input" inputMode="decimal" defaultValue={f?.adjustment ?? 0} /></div>
            </div>
            <label className="crew-check"><input type="checkbox" name="breakfast" defaultChecked={f?.breakfast ?? true} /> {c("breakfast")}</label>
            <label className="crew-check"><input type="checkbox" name="off_half" defaultChecked={f?.off_half ?? false} /> {c("offHalf")}</label>
            <div className="field"><label htmlFor="fin_notes">{c("notes")}</label><textarea id="fin_notes" name="notes" className="input" rows={2} defaultValue={f?.notes ?? ""} /></div>
            <div><button className="btn btn-sm btn-primary">{c("save")}</button></div>
          </CrewForm>
        </Card>
      )}
      <Card title={c("personalData")}>
        {p.record?.updated_at && <p className="muted small" style={{ marginTop: 0 }}>{c("lastUpdate")}: {formatDateTime(p.record.updated_at, locale)}</p>}
        <CrewSheetForm profileId={p.id} record={p.record as CrewRecord | null} photoUrl={await crewPhotoUrl(p.record?.photo_path)} L={L} locale={locale} />
      </Card>
    </div>
  );
}
