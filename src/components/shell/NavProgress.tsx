"use client";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin progress bar at the top of the page, shown the moment an internal link is clicked
 * and hidden when the new page is on screen. Gives immediate feedback while the server works.
 */
export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [active, setActive] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => { setActive(false); }, [pathname, search]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname.startsWith("/api/")) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      setActive(true);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // While a navigation is pending, a light re-render every 250 ms: the app router sometimes holds a page it
  // already received until React renders again (seen as clicks that took 15 s), and this lets it through.
  // Safety net: never leave the bar on screen.
  useEffect(() => {
    if (!active) return;
    const tick = setInterval(() => setTick((n) => n + 1), 250);
    const id = setTimeout(() => setActive(false), 15000);
    return () => { clearInterval(tick); clearTimeout(id); };
  }, [active]);

  return <div className={`nav-progress${active ? " is-active" : ""}`} role="progressbar" aria-hidden={!active} aria-label="Loading" />;
}
