"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import { LOCALES, tx } from "@/lib/i18n";
import { LANG_NAMES } from "@/lib/event";
import { CHANNEL_KINDS, dayLabel, type ChannelSlot } from "@/lib/channel";
import { copyChannelDay, deleteChannelSlot, publishChannelDay, saveChannelSlot } from "@/lib/actions/channel";
import { Alert, Badge, EmptyState } from "@/components/ui";
import { ConfirmButton } from "@/components/ui/ConfirmButton";

type Opt = { id: string; title: string };
type Form = { id?: string; start_time: string; end_time: string; kind: string; sport_id: string; venue_id: string; titles: Record<string, string>; notes: Record<string, string> };
const empty = (start = ""): Form => ({ start_time: start, end_time: "", kind: "live", sport_id: "", venue_id: "", titles: {}, notes: {} });

export function ChannelEditor({ day, days, summary, slots, sports, venues, intl }: {
  day: string; days: string[]; summary: Record<string, { count: number; published: number }>;
  slots: ChannelSlot[]; sports: Opt[]; venues: Opt[]; intl: string;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [form, setForm] = useState<Form>(empty(slots.at(-1)?.end_time ?? ""));
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [copyFrom, setCopyFrom] = useState("");
  const [pending, start] = useTransition();
  const S = new Map(sports.map((s) => [s.id, s.title]));
  const V = new Map(venues.map((v) => [v.id, v.title]));
  const published = slots.length > 0 && slots.every((s) => s.status === "published");
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okText: string, after?: () => void) => start(async () => {
    const r = await fn();
    setMsg(r.ok ? { tone: "success", text: okText } : { tone: "danger", text: t(`channel.admin.errors.${r.error ?? "generic"}`) });
    if (r.ok) { after?.(); router.refresh(); }
  });
  const edit = (s: ChannelSlot) => setForm({
    id: s.id, start_time: s.start_time, end_time: s.end_time ?? "", kind: s.kind, sport_id: s.sport_id ?? "", venue_id: s.venue_id ?? "",
    titles: Object.fromEntries(LOCALES.map((l) => [l, String(s[`title_${l}`] ?? "")])), notes: Object.fromEntries(LOCALES.map((l) => [l, String(s[`notes_${l}`] ?? "")])),
  });
  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="stack">
      <nav className="chip-row" aria-label={t("channel.days")}>
        {days.map((d) => (
          <Link key={d} prefetch={false} href={`/admin/channel?day=${d}`} className={`chip${d === day ? " is-active" : ""}`} aria-current={d === day ? "page" : undefined}>
            {dayLabel(d, intl)}
            {summary[d]?.count ? <span className="chip-count">{summary[d].published === summary[d].count ? "✓ " : ""}{summary[d].count}</span> : null}
          </Link>
        ))}
      </nav>
      <form className="row" onSubmit={(e) => { e.preventDefault(); const d = new FormData(e.currentTarget).get("goto"); if (d) router.push(`/admin/channel?day=${d}`); }}>
        <label className="small" htmlFor="goto">{t("channel.admin.otherDay")}</label>
        <input id="goto" name="goto" type="date" className="input" style={{ width: "auto" }} defaultValue={day} />
        <button className="btn btn-sm" type="submit">{t("channel.admin.open")}</button>
      </form>

      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}

      <section className="card stack-sm" aria-labelledby="day-title">
        <div className="row-between">
          <h2 id="day-title" style={{ margin: 0 }}>{dayLabel(day, intl, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h2>
          <div className="row">
            {slots.length > 0 && <Badge tone={published ? "success" : "warning"}>{published ? t("cms.status.published") : t("cms.status.draft")}</Badge>}
            {slots.length > 0 && (published
              ? <button type="button" className="btn btn-sm" disabled={pending} onClick={() => run(() => publishChannelDay(day, false), t("channel.admin.unpublished"))}>{t("channel.admin.unpublish")}</button>
              : <button type="button" className="btn btn-sm btn-primary" disabled={pending} onClick={() => run(() => publishChannelDay(day, true), t("channel.admin.published"))}>{t("channel.admin.publish")}</button>)}
          </div>
        </div>
        {slots.length === 0 ? <EmptyState icon="play">{t("channel.admin.emptyDay")}</EmptyState> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th scope="col">{t("channel.time")}</th><th scope="col">{t("channel.programme")}</th><th scope="col">{t("channel.type")}</th><th scope="col"><span className="sr-only">{t("cms.edit")}</span></th></tr></thead>
              <tbody>
                {slots.map((s) => (
                  <tr key={s.id} className={form.id === s.id ? "is-selected" : undefined}>
                    <td className="sched-time">{s.start_time}{s.end_time ? `–${s.end_time}` : ""}</td>
                    <td>
                      <strong>{tx(s, "title", locale) || (s.sport_id ? S.get(s.sport_id) : "") || "—"}</strong>
                      <div className="small muted">{[s.sport_id && tx(s, "title", locale) ? S.get(s.sport_id) : null, s.venue_id ? V.get(s.venue_id) : null].filter(Boolean).join(" · ")}</div>
                    </td>
                    <td>{t(`channel.kinds.${s.kind}`)}{s.status !== "published" && <> <Badge tone="warning">{t("cms.status.draft")}</Badge></>}</td>
                    <td className="row" style={{ justifyContent: "flex-end" }}>
                      <button type="button" className="btn btn-sm" onClick={() => edit(s)}>{t("cms.edit")}</button>
                      <ConfirmButton className="btn btn-sm" message={t("channel.admin.confirmDelete")} onConfirm={() => run(() => deleteChannelSlot(s.id), t("channel.admin.deleted"), () => { if (form.id === s.id) setForm(empty()); })}>{t("cms.delete")}</ConfirmButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card stack-sm" aria-labelledby="slot-form">
        <h2 id="slot-form" style={{ margin: 0 }}>{form.id ? t("channel.admin.editSlot") : t("channel.admin.addSlot")}</h2>
        <form className="channel-editor-form" onSubmit={(e) => { e.preventDefault(); run(() => saveChannelSlot({ ...form, day }), t("channel.admin.saved"), () => setForm(empty(form.end_time))); }}>
          <div className="field"><label htmlFor="c-start">{t("channel.admin.start")}</label><input id="c-start" type="time" className="input" required value={form.start_time} onChange={(e) => set("start_time", e.target.value)} /></div>
          <div className="field"><label htmlFor="c-end">{t("channel.admin.end")}</label><input id="c-end" type="time" className="input" value={form.end_time} onChange={(e) => set("end_time", e.target.value)} /></div>
          <div className="field"><label htmlFor="c-kind">{t("channel.type")}</label>
            <select id="c-kind" className="select" value={form.kind} onChange={(e) => set("kind", e.target.value)}>
              {CHANNEL_KINDS.map((k) => <option key={k} value={k}>{t(`channel.kinds.${k}`)}</option>)}
            </select></div>
          <div className="field"><label htmlFor="c-sport">{t("venues.sport")}</label>
            <select id="c-sport" className="select" value={form.sport_id} onChange={(e) => set("sport_id", e.target.value)}>
              <option value="">—</option>{sports.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select></div>
          <div className="field"><label htmlFor="c-venue">{t("schedule.venue")}</label>
            <select id="c-venue" className="select" value={form.venue_id} onChange={(e) => set("venue_id", e.target.value)}>
              <option value="">—</option>{venues.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}
            </select></div>
          {LOCALES.map((l) => (
            <div key={l} className="field span-all">
              <label htmlFor={`c-title-${l}`}>{t("channel.admin.programmeTitle")} · {LANG_NAMES[l]}</label>
              <input id={`c-title-${l}`} className="input" maxLength={200} value={form.titles[l] ?? ""} onChange={(e) => setForm((f) => ({ ...f, titles: { ...f.titles, [l]: e.target.value } }))} />
            </div>
          ))}
          <details className="span-all stack-sm" open={LOCALES.some((l) => form.notes[l])}>
            <summary>{t("channel.admin.notes")}</summary>
          {LOCALES.map((l) => (
            <div key={`n-${l}`} className="field">
              <label htmlFor={`c-notes-${l}`}>{t("channel.admin.notes")} · {LANG_NAMES[l]}</label>
              <textarea id={`c-notes-${l}`} className="textarea" rows={2} maxLength={1000} value={form.notes[l] ?? ""} onChange={(e) => setForm((f) => ({ ...f, notes: { ...f.notes, [l]: e.target.value } }))} />
            </div>
          ))}
          </details>
          <p className="small muted span-all" style={{ margin: 0 }}>{t("channel.admin.help")}</p>
          <div className="row span-all">
            <button type="submit" className="btn btn-primary" disabled={pending}>{form.id ? t("common.save") : t("channel.admin.add")}</button>
            {form.id && <button type="button" className="btn" onClick={() => setForm(empty())}>{t("common.cancel")}</button>}
          </div>
        </form>
      </section>

      <section className="card stack-sm" aria-labelledby="copy-title">
        <h2 id="copy-title" style={{ margin: 0 }}>{t("channel.admin.copyTitle")}</h2>
        <form className="row" onSubmit={(e) => { e.preventDefault(); if (copyFrom) run(() => copyChannelDay(copyFrom, day), t("channel.admin.copied")); }}>
          <label htmlFor="c-copy" className="small">{t("channel.admin.copyFrom")}</label>
          <select id="c-copy" className="select" style={{ width: "auto" }} value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)}>
            <option value="">—</option>
            {days.filter((d) => d !== day && summary[d]?.count).map((d) => <option key={d} value={d}>{dayLabel(d, intl)} ({summary[d].count})</option>)}
          </select>
          <button type="submit" className="btn btn-sm" disabled={pending || !copyFrom}>{t("channel.admin.copy")}</button>
        </form>
      </section>
    </div>
  );
}
