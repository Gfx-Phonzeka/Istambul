"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ResumableUpload } from "./ResumableUpload";
import { setBriefingFile, type BriefingFileKind } from "@/lib/actions/media";
import { useI18n } from "@/lib/i18n/client";
import { EVENT } from "@/lib/event";

const SLOTS: { kind: BriefingFileKind; accept: string }[] = [
  { kind: "video", accept: "video/mp4,video/webm,video/quicktime" },
  { kind: "poster", accept: "image/png,image/jpeg,image/webp" },
  // One subtitles file per portal language (Istanbul EN/TR, Lima ES/EN/PT).
  ...EVENT.locales.map((l) => ({ kind: `subtitles_${l}` as BriefingFileKind, accept: ".vtt,text/vtt" })),
];

export function BriefingFilesPanel({ videoId, files }: { videoId: string; files: Record<BriefingFileKind, string | null> }) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <section className="card stack">
      <h2 className="card-title" style={{ margin: 0 }}>{t("briefings.admin.files")}</h2>
      <p className="hint" style={{ margin: 0 }}>{t("briefings.admin.filesHelp")}</p>
      <ul className="list">
        {SLOTS.map(({ kind, accept }) => {
          const path = files[kind];
          return (
            <li key={kind} className="row-between">
              <div>
                <strong>{t(`briefings.admin.slots.${kind}`)}</strong>
                <div className="muted small">{path ? path.split("/").pop() : t("briefings.admin.none")}</div>
              </div>
              <div className="row">
                <ResumableUpload bucket="briefings" prefix={`videos/${videoId}/${kind}`} accept={accept}
                  label={path ? t("briefings.admin.replace") : t("briefings.admin.upload")}
                  onUploaded={async (f) => { await setBriefingFile(videoId, kind, f.path, { mime: f.mime, duration: f.duration }); router.refresh(); }} />
                {path && (
                  <button type="button" className="btn btn-sm btn-ghost" disabled={pending}
                    onClick={() => start(async () => { await setBriefingFile(videoId, kind, null); router.refresh(); })}>{t("cms.delete")}</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
