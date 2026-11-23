// One codebase, one deployment per event. NEXT_PUBLIC_EVENT picks the event ("istanbul" by default).
// Everything that differs between the Istanbul and Lima portals lives here.

export type Locale = "en" | "tr" | "es" | "pt";
export type EventId = "istanbul" | "lima";

export interface EventConfig {
  id: EventId;
  /** Interface and content languages, in menu order. The first is the default and the fallback for empty content. */
  locales: Locale[];
  /** Languages of the Production Guidelines manual (team only). */
  guideLangs: Locale[];
  /** Local time zone of the Games and its fixed UTC offset during the Games (used for date-time inputs). */
  tz: string;
  utcOffset: string;
  slug: string; // file-name prefix for downloads
  name: string; // "Istanbul 2027"
  logo: { src: string; width: number; height: number };
  /** Right-holder service requests: "none" (handled by someone else) or "booking" (gateway to the booking site). */
  rhbRequests: "none" | "booking";
  bookingUrl?: string;
}

const EVENTS: Record<EventId, EventConfig> = {
  istanbul: {
    id: "istanbul",
    locales: ["en", "tr"],
    guideLangs: ["en", "pt", "tr"],
    tz: "Europe/Istanbul",
    utcOffset: "+03:00",
    slug: "istanbul2027",
    name: "Istanbul 2027",
    logo: { src: "/brand/istanbul2027-logo.png", width: 214, height: 194 },
    rhbRequests: "none",
  },
  lima: {
    id: "lima",
    locales: ["es", "en", "pt"],
    guideLangs: ["es", "pt"],
    tz: "America/Lima",
    utcOffset: "-05:00",
    slug: "lima2027",
    name: "Lima 2027",
    logo: { src: "/brand/lima2027-logo.png", width: 420, height: 227 },
    rhbRequests: "booking",
    bookingUrl: "https://huin.tv:4443/",
  },
};

export const LANG_NAMES: Record<Locale, string> = { en: "English", tr: "Türkçe", es: "Español", pt: "Português" };

export const EVENT: EventConfig = EVENTS[process.env.NEXT_PUBLIC_EVENT === "lima" ? "lima" : "istanbul"];
export const isLima = EVENT.id === "lima";
