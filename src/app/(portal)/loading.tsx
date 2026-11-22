/** Structural skeleton shown while a portal page loads (keeps the layout stable). */
export default function Loading() {
  return (
    <div className="stack" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div>
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-line" />
      </div>
      <div className="grid grid-2">
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
      <div className="skeleton skeleton-card" />
    </div>
  );
}
