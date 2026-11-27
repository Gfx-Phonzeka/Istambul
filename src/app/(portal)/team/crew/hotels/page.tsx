import { isAdmin } from "@/lib/auth";
import { requireCrew } from "@/lib/crew-server";
import { getT } from "@/lib/i18n/server";
import { crewLabels } from "@/lib/crew";
import { loadCrew } from "@/lib/crew-data";
import { loadLogistics, nights } from "@/lib/crew-logistics";
import { addHotel, addStay, deleteHotel, deleteStay } from "@/lib/actions/crew";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { CrewTabs } from "@/components/crew/CrewTabs";
import { CrewForm } from "@/components/crew/CrewForm";

export const metadata = { title: "Crew Ops · Hotels" };
const ROOMS = ["single", "double", "twin", "triple", "other"];

export default async function CrewHotelsPage() {
  const me = await requireCrew();
  const { locale } = await getT();
  const c = crewLabels(locale);
  const [{ people }, { hotels, stays }] = await Promise.all([loadCrew(locale), loadLogistics()]);
  const P = new Map(people.map((p) => [p.id, p]));
  const name = (id: string) => { const p = P.get(id); return p ? `${p.first_name} ${p.last_name}` : "—"; };
  return (
    <div className="stack">
      <PageHeader title={c("crewOps")} subtitle={c("hotelsIntro")} />
      <CrewTabs active="hotels" c={c} admin={isAdmin(me)} />
      <Card title={c("addHotel")}>
        <CrewForm action={addHotel} saved={c("saved")} error={c("error")}>
          <input name="name" className="input" placeholder={c("hotelName")} aria-label={c("hotelName")} required maxLength={120} />
          <input name="address" className="input" placeholder={c("address")} aria-label={c("address")} maxLength={200} />
          <input name="city" className="input" placeholder={c("city")} aria-label={c("city")} maxLength={80} />
          <input name="phone" className="input" placeholder={c("phoneHotel")} aria-label={c("phoneHotel")} maxLength={40} />
          <button className="btn btn-sm btn-primary">{c("addHotel")}</button>
        </CrewForm>
      </Card>
      {hotels.length > 0 && (
        <Card title={c("addStay")}>
          <CrewForm action={addStay} saved={c("saved")} error={c("error")}>
            <select name="profile_id" className="input" required defaultValue="" aria-label={c("person")}>
              <option value="" disabled>{c("person")}</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.last_name}, {p.first_name}</option>)}
            </select>
            <select name="hotel_id" className="input" required aria-label={c("hotel")}>{hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select>
            <label className="crew-inline">{c("checkIn")} <input name="check_in" type="date" className="input" required /></label>
            <label className="crew-inline">{c("checkOut")} <input name="check_out" type="date" className="input" required /></label>
            <select name="room_type" className="input" aria-label={c("roomType")}>{ROOMS.map((r) => <option key={r} value={r}>{c(`room_${r}`)}</option>)}</select>
            <input name="room_code" className="input" placeholder={c("roomCode")} aria-label={c("roomCode")} maxLength={20} style={{ maxWidth: 200 }} />
            <button className="btn btn-sm btn-primary">{c("addStay")}</button>
          </CrewForm>
        </Card>
      )}
      {hotels.length === 0 ? <Card><EmptyState icon="pin">{c("noStays")}</EmptyState></Card> : hotels.map((h) => {
        const hs = stays.filter((s) => s.hotel_id === h.id);
        // Rooming list: one line per room (same room code = shared), or per stay when there is no code.
        const rooms = new Map<string, typeof hs>();
        for (const s of hs) { const k = s.room_code ? `code:${s.room_code}` : `stay:${s.id}`; rooms.set(k, [...(rooms.get(k) ?? []), s]); }
        return (
          <Card key={h.id} title={`${h.name}${h.city ? ` · ${h.city}` : ""}`}
            actions={<div className="crew-actions">
              <a className="btn btn-sm" href={`/api/crew/export?kind=rooming&hotel=${h.id}`}>{c("exportRooming")}</a>
              <ConfirmButton className="btn btn-sm" message={c("confirmDeleteUnit")} confirmLabel={c("delete")} onConfirm={deleteHotel.bind(null, h.id)}>{c("delete")}</ConfirmButton>
            </div>}>
            {h.address && <p className="muted small" style={{ marginTop: 0 }}>{h.address}{h.phone ? ` · ${h.phone}` : ""}</p>}
            {hs.length === 0 ? <p className="muted" style={{ margin: 0 }}>{c("noStays")}</p> : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>{c("roomCode")}</th><th>{c("roomType")}</th><th>{c("people")}</th><th>{c("checkIn")} → {c("checkOut")}</th><th /></tr></thead>
                  <tbody>
                    {[...rooms.values()].map((group) => (
                      <tr key={group[0].id}>
                        <td className="small">{group[0].room_code ?? "—"}</td>
                        <td className="small">{c(`room_${group[0].room_type}`)}</td>
                        <td>{group.map((s) => <div key={s.id}><strong>{name(s.profile_id)}</strong></div>)}</td>
                        <td className="small">{group.map((s) => <div key={s.id}>{s.check_in} → {s.check_out} ({nights(s.check_in, s.check_out)} {c("nights")})</div>)}</td>
                        <td>{group.map((s) => <div key={s.id}><ConfirmButton className="btn btn-sm" message={c("remove")} confirmLabel={c("remove")} onConfirm={deleteStay.bind(null, s.id)}>{c("remove")}</ConfirmButton></div>)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
