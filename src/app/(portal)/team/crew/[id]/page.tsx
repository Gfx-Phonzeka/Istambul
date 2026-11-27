import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCrew, crewPhotoUrl } from "@/lib/crew-server";
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
  await requireCrew();
  const { id } = await params;
  const { locale } = await getT();
  const c = crewLabels(locale);
  const [{ people, functions, teams, fname }, plan, { V, S }] = await Promise.all([loadCrew(locale), loadPlan(), venueSportNames(locale)]);
  const p = people.find((x) => x.id === id);
  if (!p) notFound();
  const L = crewDict(locale);
  const days = [...personDays(plan, p.id).values()];
  const U = new Map(plan.units.map((u) => [u.id, u.code]));
  return (
    <div className="stack">
      <PageHeader title={`${p.first_name} ${p.last_name}`} subtitle={[p.email, p.phone, p.organization].filter(Boolean).join(" · ")}
        actions={<Link className="btn btn-sm" href="/team/crew">← {c("back")}</Link>} />
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
          <PeriodFields c={c} extraTypes={["none", "auto"]} />
          <select name="unit_id" className="input" aria-label={c("unit")} defaultValue=""><option value="">{c("unit")}</option>{plan.units.map((u) => <option key={u.id} value={u.id}>{u.code}</option>)}</select>
          <input name="notes" className="input" placeholder={c("note")} aria-label={c("note")} maxLength={300} />
          <button className="btn btn-sm btn-primary">{c("apply")}</button>
        </CrewForm>
      </Card>
      <Card title={c("personalData")}>
        {p.record?.updated_at && <p className="muted small" style={{ marginTop: 0 }}>{c("lastUpdate")}: {formatDateTime(p.record.updated_at, locale)}</p>}
        <CrewSheetForm profileId={p.id} record={p.record as CrewRecord | null} photoUrl={await crewPhotoUrl(p.record?.photo_path)} L={L} locale={locale} />
      </Card>
    </div>
  );
}
