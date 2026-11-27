"use client";
import { startTransition, useActionState, type FormEvent, useRef, useState } from "react";
import { saveCrewSheet } from "@/lib/actions/crew";
import { createClient } from "@/lib/supabase/client";
import { EXTRA_FIELDS, SHEET_FIELDS, completeness, type CrewRecord } from "@/lib/crew";

type Labels = Record<string, string>;
const GROUPS: { title: string; keys: string[] }[] = [
  { title: "personal", keys: ["nationality", "date_of_birth", "gender", "languages"] },
  { title: "documents", keys: ["id_type", "id_number", "id_expiry"] },
  { title: "emergency", keys: ["emergency_name", "emergency_phone"] },
  { title: "uniform", keys: ["polo_size", "hoodie_size"] },
];

/** Personal crew sheet. `profileId` is the person being edited (themself, or someone else when used by coordination). */
export function CrewSheetForm({ profileId, record, photoUrl, L, locale }: {
  profileId: string; record: Partial<CrewRecord> | null; photoUrl: string | null; L: Labels; locale: string;
}) {
  const [state, action, pending] = useActionState(saveCrewSheet, undefined);
  // Submit without the automatic form reset, so the saved values stay on screen.
  const submit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(() => action(fd)); };
  const [photoPath, setPhotoPath] = useState(record?.photo_path ?? "");
  const [preview, setPreview] = useState(photoUrl);
  const [uploading, setUploading] = useState(false);
  const [photoErr, setPhotoErr] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setPhotoErr(false);
    if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 5 * 1024 * 1024) { setPhotoErr(true); return; }
    setUploading(true);
    const path = `${profileId}/photo-${Date.now()}.${file.type === "image/png" ? "png" : "jpg"}`;
    const { error } = await createClient().storage.from("crew-photos").upload(path, file, { contentType: file.type, upsert: true });
    setUploading(false);
    if (error) { setPhotoErr(true); return; }
    setPhotoPath(path);
    setPreview(URL.createObjectURL(file));
  }

  const pct = completeness({ ...record, photo_path: photoPath || null });
  const field = (key: string) => {
    const f = SHEET_FIELDS.find((x) => x.key === key)!;
    const value = (record as Record<string, unknown> | null)?.[key];
    return (
      <div className="field" key={key}>
        <label htmlFor={key}>{L[key]}</label>
        {f.type === "select" ? (
          <select id={key} name={key} className="input" defaultValue={String(value ?? "")}>
            <option value="">{L.choose}</option>
            {f.options.map((o) => <option key={o} value={o}>{L[o] ?? o}</option>)}
          </select>
        ) : (
          <input id={key} name={key} type={f.type} className="input" defaultValue={String(value ?? "")} autoComplete="off" />
        )}
      </div>
    );
  };

  return (
    <form onSubmit={submit} className="stack">
      <input type="hidden" name="profile_id" value={profileId} />
      <input type="hidden" name="photo_path" value={photoPath} />
      <div className="crew-progress" aria-label={L.complete.replace("{n}", String(pct))}>
        <div className="crew-progress-bar"><span style={{ width: `${pct}%` }} /></div>
        <span className="small muted">{L.complete.replace("{n}", String(pct))}</span>
      </div>
      <fieldset className="crew-fieldset">
        <legend>{L.photo}</legend>
        <div className="crew-photo-row">
          <div className="crew-photo">{preview ? <img src={preview} alt="" /> : <span aria-hidden>👤</span>}</div>
          <div>
            <p className="small muted" style={{ marginTop: 0 }}>{L.photoHelp}</p>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            <button type="button" className="btn btn-sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? "…" : preview ? L.photoChange : L.photoUpload}
            </button>
            {photoErr && <div className="alert alert-danger small" role="alert" style={{ marginTop: 8 }}>{L.photoHelp}</div>}
          </div>
        </div>
      </fieldset>
      {GROUPS.map((g) => (
        <fieldset className="crew-fieldset" key={g.title}>
          <legend>{L[g.title]}</legend>
          <div className="crew-grid">{g.keys.map(field)}</div>
        </fieldset>
      ))}
      {EXTRA_FIELDS.length > 0 && (
        <fieldset className="crew-fieldset">
          <div className="crew-grid">
            {EXTRA_FIELDS.map((f) => (
              <div className="field" key={f.key}>
                <label htmlFor={`extra_${f.key}`}>{f.label[(locale as "en") ?? "en"] ?? f.label.en}</label>
                <input id={`extra_${f.key}`} name={`extra_${f.key}`} type={f.type} className="input" defaultValue={record?.extra?.[f.key] ?? ""} />
              </div>
            ))}
          </div>
        </fieldset>
      )}
      {state?.error && <div className="alert alert-danger" role="alert">{L.error}</div>}
      {state?.ok && <div className="alert alert-success" role="status">{L.saved}</div>}
      <div><button className="btn btn-primary" disabled={pending || uploading}>{L.save}</button></div>
    </form>
  );
}
