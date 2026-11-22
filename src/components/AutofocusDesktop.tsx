"use client";
import { useEffect } from "react";

/** Focuses the element marked data-autofocus-desktop, only on devices with a fine pointer (not phones). */
export function AutofocusDesktop() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    (document.querySelector("[data-autofocus-desktop]") as HTMLElement | null)?.focus();
  }, []);
  return null;
}
