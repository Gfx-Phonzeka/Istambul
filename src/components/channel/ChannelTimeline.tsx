import { dayLabel, KIND_COLOR, minutes, type ChannelKind } from "@/lib/channel";

// Integrated Channel timeline: one row per day, a 24-hour axis, one coloured block per programme.
export interface TimelineItem { id: string; day: string; start: string; end: string | null; kind: ChannelKind; title: string; detail: string }

const nextDay = (d: string) => { const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + 1); return x.toISOString().slice(0, 10); };

export function ChannelTimeline({ items, days, intl, kindLabel, current, nowMark }: {
  items: TimelineItem[]; days: string[]; intl: string; kindLabel: Record<string, string>; current?: string; nowMark?: { day: string; time: string };
}) {
  // Programmes that run past midnight continue on the next day's row.
  const pieces = items.flatMap((it) => {
    const s = minutes(it.start), e = it.end ? minutes(it.end) : s + 30;
    if (e > s) return [{ ...it, row: it.day, from: s, to: e }];
    return [{ ...it, row: it.day, from: s, to: 1440 }, ...(e > 0 ? [{ ...it, row: nextDay(it.day), from: 0, to: e, cont: true }] : [])];
  });
  const hours = Array.from({ length: 13 }, (_, i) => i * 2);
  const used = [...new Set(items.map((i) => i.kind))];
  return (
    <div className="stack-sm">
      <div className="tl-scroll" tabIndex={0} role="region" aria-label="Timeline">
        <div className="tl">
          <div className="tl-axis" aria-hidden="true">
            <span className="tl-day" />
            <div className="tl-track">
              {hours.map((h) => <span key={h} className="tl-tick" style={{ left: `${(h / 24) * 100}%` }}>{String(h % 24).padStart(2, "0")}:00</span>)}
            </div>
          </div>
          {days.map((d) => (
            <div key={d} className={`tl-row${d === current ? " is-current" : ""}`}>
              <a className="tl-day" href={`/channel?day=${d}`}>{dayLabel(d, intl)}</a>
              <div className="tl-track">
                {hours.map((h) => <span key={h} className="tl-grid" style={{ left: `${(h / 24) * 100}%` }} />)}
                {nowMark?.day === d && <span className="tl-now" style={{ left: `${(minutes(nowMark.time) / 1440) * 100}%` }} aria-hidden="true" />}
                {pieces.filter((p) => p.row === d).map((p, i) => (
                  <div key={`${p.id}-${i}`} className="tl-block" style={{ left: `${(p.from / 1440) * 100}%`, width: `calc(${((p.to - p.from) / 1440) * 100}% - 2px)`, background: KIND_COLOR[p.kind] }}
                    title={`${p.start}${p.end ? `–${p.end}` : ""} · ${p.title} · ${kindLabel[p.kind]}${p.detail ? ` · ${p.detail}` : ""}`}>
                    <strong>{p.title}</strong>
                    <span>{p.start}{p.end ? `–${p.end}` : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <ul className="cal-legend small">
        {used.map((k) => <li key={k}><span className="cal-swatch" style={{ background: KIND_COLOR[k] }} />{kindLabel[k]}</li>)}
      </ul>
    </div>
  );
}
