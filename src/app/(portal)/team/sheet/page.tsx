import { requireTeam } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { crewDict, crewLabels, type CrewRecord } from "@/lib/crew";
import { crewPhotoUrl } from "@/lib/crew-server";
import { Card, PageHeader } from "@/components/ui";
import { CrewSheetForm } from "@/components/crew/CrewSheetForm";

export const metadata = { title: "Crew sheet" };

export default async function MySheetPage() {
  const me = await requireTeam();
  const { locale } = await getT();
  const c = crewLabels(locale);
  const supabase = await createClient();
  const [{ data: record }, { data: part }, { data: teams }] = await Promise.all([
    supabase.from("crew_records").select("*").eq("profile_id", me.id).maybeSingle(),
    supabase.from("crew_participation").select("position_label,collaborator_type,company,crew_functions(name_en,name_es,name_pt)").eq("profile_id", me.id).maybeSingle(),
    supabase.from("crew_team_members").select("crew_teams(name)").eq("profile_id", me.id),
  ]);
  const fn = part?.crew_functions as unknown as Record<string, string> | null;
  const fnName = fn ? (fn[`name_${locale}`] || fn.name_en) : null;
  const teamNames = (teams ?? []).map((t) => (t.crew_teams as unknown as { name: string } | null)?.name).filter(Boolean);
  return (
    <div className="stack">
      <PageHeader title={c("mySheet")} subtitle={c("mySheetIntro")} />
      <Card title={c("myRole")}>
        {fnName || teamNames.length ? (
          <dl className="crew-dl">
            <dt>{c("function")}</dt><dd>{fnName ?? "—"}{part?.position_label ? ` · ${part.position_label}` : ""}</dd>
            <dt>{c("teams")}</dt><dd>{teamNames.join(", ") || "—"}</dd>
            {part?.collaborator_type && <><dt>{c("type")}</dt><dd>{c(part.collaborator_type)}{part.company ? ` · ${part.company}` : ""}</dd></>}
          </dl>
        ) : <p className="muted" style={{ margin: 0 }}>{c("notAssigned")}</p>}
      </Card>
      <Card title={c("personalData")}>
        <CrewSheetForm profileId={me.id} record={record as CrewRecord | null} photoUrl={await crewPhotoUrl(record?.photo_path)} L={crewDict(locale)} locale={locale} />
      </Card>
    </div>
  );
}
