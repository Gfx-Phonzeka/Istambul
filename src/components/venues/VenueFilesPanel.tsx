"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import { ResumableUpload } from "@/components/media/ResumableUpload";
import { addVenueFile, deleteVenueFile, updateVenueFile } from "@/lib/actions/venues";
import { ConfirmButton } from "@/components/ui/ConfirmButton";

export interface VenueFileRow { id: string; kind: "photo" | "document"; title_en: string | null; title_tr: string | null; file_name: string; url: string | null }

function FileRow({ f }: { f: VenueFileRow }) {
  const { t } = useI18n();
  const router = useRouter();
  const [en, setEn] = useState(f.title_en ?? "");
  const [tr, setTr] = useState(f.title_tr ?? "");
  const [pending, start] = useTransition();
  return (
    <li className="row">
      {f.kind === "photo" && f.url && <img src={f.url} alt="" style={{ width: 80, height: 45, objectFit: "cover", borderRadius: 4 }} />}
      <input className="input" style={{ flex: 1, minWidth: 140 }} value={en} onChange={(e) => setEn(e.target.value)} placeholder={`${t("cms.fields.title")} (EN)`} />
      <input className="input" style={{ flex: 1, minWidth: 140 }} value={tr} onChange={(e) => setTr(e.target.value)} placeholder={`${t("cms.fields.title")} (TR)`} />
      <span className="muted small">{f.file_name}</span>
      <button type="button" className="btn btn-sm" disabled={pending} onClick={() => start(async () => { await updateVenueFile(f.id, en, tr); router.refresh(); })}>{t("common.save")}</button>
      <ConfirmButton className="btn btn-sm btn-ghost" style={{ color: "var(--color-danger)" }} disabled={pending} message={t("cms.deleteConfirm")}
        onConfirm={() => start(async () => { await deleteVenueFile(f.id); router.refresh(); })}>{t("cms.delete")}</ConfirmButton>
    </li>
  );
}

export function VenueFilesPanel({ venueId, files }: { venueId: string; files: VenueFileRow[] }) {
  const { t } = useI18n();
  const router = useRouter();
  return (
    <section className="card stack">
      <h2 className="card-title" style={{ margin: 0 }}>{t("venues.admin.files")}</h2>
      {(["photo", "document"] as const).map((kind) => (
        <div key={kind} className="stack-sm">
          <div className="row-between">
            <strong>{kind === "photo" ? t("venues.photos") : t("venues.documents")}</strong>
            <ResumableUpload bucket="venues" prefix={`venues/${venueId}/${kind}`}
              accept={kind === "photo" ? "image/png,image/jpeg,image/webp" : ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,application/pdf"}
              label={kind === "photo" ? t("venues.admin.addPhoto") : t("venues.admin.addDocument")}
              onUploaded={async (f) => { await addVenueFile(venueId, kind, { path: f.path, name: f.name, size: f.size, mime: f.mime }); router.refresh(); }} />
          </div>
          <ul className="list">{files.filter((f) => f.kind === kind).map((f) => <FileRow key={f.id} f={f} />)}</ul>
        </div>
      ))}
    </section>
  );
}
