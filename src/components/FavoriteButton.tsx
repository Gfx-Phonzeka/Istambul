"use client";
import { useState, useTransition } from "react";
import { toggleFavorite } from "@/lib/actions/favorites";
import { useI18n } from "@/lib/i18n/client";

/** Star toggle: following an item sends notifications when it changes. */
export function FavoriteButton({ kind, id, initial, compact = false, label }: { kind: "venue" | "sport" | "media_asset"; id: string; initial: boolean; compact?: boolean; label?: string }) {
  const { t } = useI18n();
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  const text = on ? t("favorites.following") : t("favorites.follow");
  return (
    <button
      type="button"
      className={`btn btn-sm fav-btn${on ? " is-on" : ""}${compact ? " btn-ghost" : ""}`}
      aria-pressed={on}
      disabled={pending}
      title={on ? t("favorites.unfollowHint") : t("favorites.followHint")}
      aria-label={label ? `${text}: ${label}` : text}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); const next = !on; setOn(next); start(async () => { const r = await toggleFavorite(kind, id, next); if (!r.ok) setOn(!next); }); }}
    >
      <span aria-hidden="true">{on ? "★" : "☆"}</span>{!compact && ` ${text}`}
    </button>
  );
}
