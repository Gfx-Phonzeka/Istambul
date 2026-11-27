"use client";
import { startTransition, useActionState, type FormEvent, useState } from "react";
import { saveParticipation } from "@/lib/actions/crew";
import { COLLAB_TYPES } from "@/lib/crew";

type Fn = { id: string; area: string; label: string };
type Team = { id: string; name: string; kind: string };

export function ParticipationForm({ profileId, value, functions, teams, L }: {
  profileId: string; functions: Fn[]; teams: Team[]; L: Record<string, string>;
  value: { function_id: string | null; position_label: string | null; collaborator_type: string | null; company: string | null; notes: string | null; teamIds: string[]; in_mediagest?: boolean };
}) {
  const [state, action, pending] = useActionState(saveParticipation, undefined);
  // Submit without the automatic form reset, so the saved values stay on screen.
  const submit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(() => action(fd)); };
  const [type, setType] = useState(value.collaborator_type ?? "");
  const areas = [...new Set(functions.map((f) => f.area))];
  return (
    <form onSubmit={submit} className="stack">
      <input type="hidden" name="profile_id" value={profileId} />
      <div className="crew-grid">
        <div className="field">
          <label htmlFor="function_id">{L.function}</label>
          <select id="function_id" name="function_id" className="input" defaultValue={value.function_id ?? ""}>
            <option value="">{L.choose}</option>
            {areas.map((a) => (
              <optgroup key={a} label={a}>{functions.filter((f) => f.area === a).map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</optgroup>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="position_label">{L.position}</label>
          <input id="position_label" name="position_label" className="input" defaultValue={value.position_label ?? ""} placeholder="Cam 3 · SSM L" />
        </div>
        <div className="field">
          <label htmlFor="collaborator_type">{L.type}</label>
          <select id="collaborator_type" name="collaborator_type" className="input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">{L.choose}</option>
            {COLLAB_TYPES.map((t) => <option key={t} value={t}>{L[t]}</option>)}
          </select>
        </div>
        {type === "group_company" && (
          <div className="field">
            <label htmlFor="company">{L.company}</label>
            <input id="company" name="company" className="input" defaultValue={value.company ?? ""} />
          </div>
        )}
      </div>
      <fieldset className="crew-fieldset">
        <legend>{L.teams}</legend>
        {teams.length === 0 ? <p className="muted small" style={{ margin: 0 }}>—</p> : (
          <div className="crew-team-checks">
            {teams.map((t) => (
              <label key={t.id} className="crew-check"><input type="checkbox" name="teams" value={t.id} defaultChecked={value.teamIds.includes(t.id)} /> {t.name} <span className="muted small">· {L[t.kind] ?? t.kind}</span></label>
            ))}
          </div>
        )}
      </fieldset>
      <label className="crew-check" title={L.mediagestHelp}><input type="checkbox" name="in_mediagest" defaultChecked={value.in_mediagest} /> {L.mediagest} <span className="muted small">· {L.mediagestHelp}</span></label>
      <div className="field">
        <label htmlFor="notes">{L.notes}</label>
        <textarea id="notes" name="notes" className="input" rows={3} defaultValue={value.notes ?? ""} />
      </div>
      {state?.error && <div className="alert alert-danger" role="alert">{L.error}</div>}
      {state?.ok && <div className="alert alert-success" role="status">{L.saved}</div>}
      <div><button className="btn btn-primary" disabled={pending}>{L.save}</button></div>
    </form>
  );
}
