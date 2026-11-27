import { requireTeam } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { crewDict, crewLabels, type CrewRecord } from "@/lib/crew";
import { crewPhotoUrl } from "@/lib/crew-server";
import { Card, PageHeader } from "@/components/ui";
import { CrewSheetForm } from "@/components/crew/CrewSheetForm";
import { loadPlan, personDays } from "@/lib/crew-days";
import { venueSportNames } from "@/lib/crew-refs";
import { DaysList } from "@/components/crew/DaysList";
import { loadLogistics, nights } from "@/lib/crew-logistics";
import { formatDate } from "@/lib/format";

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
  const [plan, { V, S }, logi] = await Promise.all([loadPlan(), venueSportNames(locale), loadLogistics()]);
  const myTrips = logi.travels.filter((x) => x.profile_id === me.id);
  const myStays = logi.stays.filter((x) => x.profile_id === me.id);
  const H = new Map(logi.hotels.map((h) => [h.id, h]));
  const myDays = [...personDays(plan, me.id).values()];
  const U = new Map(plan.units.map((u) => [u.id, u.code]));
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
      <Card title={`${c("myDays")}${myDays.length ? ` (${myDays.length})` : ""}`}>
        {myDays.length === 0 ? <p className="muted" style={{ margin: 0 }}>{c("myDaysEmpty")}</p>
          : <DaysList days={myDays} c={c} U={U} V={V} S={S} fmt={(d) => formatDate(`${d}T12:00:00Z`, locale, "UTC")} />}
      </Card>
      <Card title={c("myTravel")}>
        {myTrips.length === 0 && myStays.length === 0 ? <p className="muted" style={{ margin: 0 }}>{c("myTravelEmpty")}</p> : (
          <div className="stack-sm">
            {myTrips.map((t) => (
              <div key={t.id}><strong>{c(`dir_${t.direction}`)}</strong> · {[t.carrier, t.number].filter(Boolean).join(" ") || c(`mode_${t.mode}`)} · {t.from_place ?? "?"} → {t.to_place ?? "?"}
                <div className="small muted">{c("depart")}: {t.depart_date} {t.depart_time ?? ""} · {c("arrive")}: {t.arrive_date ?? ""} {t.arrive_time ?? ""}{t.booking_ref ? ` · ${c("bookingRef")}: ${t.booking_ref}` : ""}</div></div>
            ))}
            {myStays.map((st) => { const h = H.get(st.hotel_id); return (
              <div key={st.id}><strong>{h?.name ?? c("hotel")}</strong>{h?.address ? ` · ${h.address}` : ""}
                <div className="small muted">{c("checkIn")}: {st.check_in} · {c("checkOut")}: {st.check_out} ({nights(st.check_in, st.check_out)} {c("nights")}) · {c(`room_${st.room_type}`)}</div></div>
            ); })}
          </div>
        )}
      </Card>
      <Card title={c("personalData")}>
        <CrewSheetForm profileId={me.id} record={record as CrewRecord | null} photoUrl={await crewPhotoUrl(record?.photo_path)} L={crewDict(locale)} locale={locale} />
      </Card>
    </div>
  );
}
