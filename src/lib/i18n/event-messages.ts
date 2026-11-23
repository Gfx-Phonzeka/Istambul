import type { PartialMessages } from "./index";
import { EVENT, type Locale } from "@/lib/event";

// Event-specific wording laid over the dictionaries. Istanbul uses en.ts / tr.ts as they are.
// es.ts and pt.ts are only used by Lima, so they already carry Lima's wording.

const LIMA_EN: PartialMessages = {
  common: {
    appName: "Lima 2027 · HB Portal",
    games: "Pan American and Parapan American Games · Lima 2027",
    hostBroadcaster: "Imagina · Host Broadcaster",
    portalFor: "Host Broadcaster portal for Right Holders, partners and the production team",
  },
  sectionInfo: {
    schedule: "Sessions by day, sport and venue (Lima time).",
    broadcast: "Feed grid, distribution and technical parameters.",
  },
  auth: { orgTypes: { right_holder: "Right Holder", partner: "Partner (Panam Sports, Organising Committee)", other: "Other" } },
  cms: {
    intro: "Create, edit and publish the portal content in Spanish, English and Portuguese. Leave a field empty to show the Spanish text.",
    fields: { dueAt: "Date and time (Lima time)", startAt: "Start (Lima time)", endAt: "End (Lima time)", isOq: "Olympic qualifier (OQ)" },
    types: { distribution_channel: "Distribution channels" },
  },
  admin: { dateTime: "Date and time (Lima time)" },
  handbook: { pdfGenerated: "Generated on {date} (Lima time) from the content published in the portal." },
  briefings: { subtitle: "Information videos from the Host Broadcaster, with subtitles." },
  schedule: {
    subtitle: "Competition sessions by day, sport and venue. Times in Lima time (PET, UTC−5) by default.",
    trt: "Lima Time (PET)",
    trtNote: "All times are Lima time (PET, UTC−5).",
  },
  broadcast: {
    subtitle: "Feed grid, distribution channels, technical parameters and additional production.",
    tabs: { feeds: "Feed Grid", distribution: "Distribution", technical: "Technical Parameters", additional: "Additional Production" },
    cols: { time: "Time (PET)", feed: "Feed", type: "Type", venue: "Venue", channel: "Channel" },
    ebuNote: "The Host Broadcaster’s responsibility ends with making the signal available.",
    contact: "Distribution contact",
  },
};

export const EVENT_MESSAGES: Partial<Record<Locale, PartialMessages>> = EVENT.id === "lima" ? { en: LIMA_EN } : {};
