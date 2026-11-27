"use client";
import { useRef, useState, useTransition } from "react";
import { setBriefingWatched } from "@/lib/actions/media";
import { useI18n } from "@/lib/i18n/client";
import { Badge } from "@/components/ui";
import { LANG_NAMES, type Locale } from "@/lib/event";

export function BriefingPlayer({ id, src, mime, poster, subtitles, watched: initial }: {
  id: string; src: string | null; mime: string | null; poster: string | null; subtitles: Locale[]; watched: boolean;
}) {
  const { t, locale } = useI18n();
  const [watched, setWatched] = useState(initial);
  const [, start] = useTransition();
  const marked = useRef(initial);

  const mark = (v: boolean) => {
    setWatched(v);
    marked.current = v;
    start(async () => { await setBriefingWatched(id, v); });
  };

  return (
    <div className="stack-sm">
      {src ? (
        <video
          className="player"
          controls
          playsInline
          preload="metadata"
          poster={poster ?? undefined}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (!marked.current && v.duration && v.currentTime / v.duration > 0.9) mark(true);
          }}
        >
          <source src={src} type={mime ?? undefined} />
          {subtitles.map((l) => <track key={l} kind="subtitles" src={`/api/briefings/${id}/subtitles/${l}`} srcLang={l} label={LANG_NAMES[l]} default={locale === l} />)}
        </video>
      ) : (
        <div className="player player-empty">{t("briefings.noVideo")}</div>
      )}
      <div className="row">
        {watched ? <Badge tone="success">✓ {t("briefings.watched")}</Badge> : <Badge>{t("briefings.notWatched")}</Badge>}
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => mark(!watched)}>
          {watched ? t("briefings.markUnwatched") : t("briefings.markWatched")}
        </button>
        <span className="muted small">{t("briefings.subtitlesHint")}</span>
      </div>
    </div>
  );
}
