/** Shown at once when a guidelines link is clicked, while the section loads. */
export default function Loading() {
  return (
    <div className="hb-layout" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <aside className="hb-aside">
        {Array.from({ length: 10 }, (_, i) => <div key={i} className="skeleton skeleton-line" />)}
      </aside>
      <article className="stack" style={{ minWidth: 0 }}>
        <div className="skeleton skeleton-line" style={{ width: "40%" }} />
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-card" style={{ height: 320 }} />
      </article>
    </div>
  );
}
