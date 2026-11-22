"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { recordPageView } from "@/lib/actions/favorites";

/** Counts page views for the statistics (ids in the address are kept, query strings are not). */
export function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    const id = setTimeout(() => { void recordPageView(pathname); }, 800);
    return () => clearTimeout(id);
  }, [pathname]);
  return null;
}
