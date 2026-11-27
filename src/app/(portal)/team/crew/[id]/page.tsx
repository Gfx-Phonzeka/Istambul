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

export default async function CrewPersonPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCrew();
  const { id } = await params;
  const { locale } = await getT();
  const c = crewLabels(locale);
  const { people, functions, teams, fname } = await loadCrew(locale);
  const p = people.find((x) => x.id === id);
  if (!p) notFound();
  const L = crewDict(locale);
  return (
    <div className="stack">
      <PageHeader title={`${p.first_name} ${p.last_name}`} subtitle={[p.email, p.phone, p.organization].filter(Boolean).join(" · ")}
        actions={<Link className="btn btn-sm" href="/team/crew">← {c("back")}</Link>} />
      <Card title={c("participation")}>
        <ParticipationForm profileId={p.id} L={L}
          functions={functions.filter((f) => f.active || f.id === p.function_id).map((f) => ({ id: f.id, area: f.area, label: fname(f) ?? f.name_en }))}
          teams={teams.map((t) => ({ id: t.id, name: t.name, kind: t.kind }))}
          value={{ function_id: p.function_id, position_label: p.position_label, collaborator_type: p.collaborator_type, company: p.company, notes: p.notes, teamIds: p.teamIds }} />
      </Card>
      <Card title={c("personalData")}>
        {p.record?.updated_at && <p className="muted small" style={{ marginTop: 0 }}>{c("lastUpdate")}: {formatDateTime(p.record.updated_at, locale)}</p>}
        <CrewSheetForm profileId={p.id} record={p.record as CrewRecord | null} photoUrl={await crewPhotoUrl(p.record?.photo_path)} L={L} locale={locale} />
      </Card>
    </div>
  );
}
