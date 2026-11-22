// Portal navigation. Order and grouping of the private-area sections.
export interface NavItem {
  key: string; // i18n key under "nav."
  href: string;
  icon: string;
}

export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "nav.groupMain",
    items: [
      { key: "dashboard", href: "/", icon: "home" },
      { key: "news", href: "/news", icon: "megaphone" },
      { key: "briefings", href: "/briefings", icon: "play" },
      { key: "mediaHub", href: "/media-hub", icon: "download" },
    ],
  },
  {
    title: "nav.groupInfo",
    items: [
      { key: "handbook", href: "/handbook", icon: "book" },
      { key: "venues", href: "/venues", icon: "pin" },
      { key: "cameraMaps", href: "/camera-maps", icon: "camera" },
      { key: "schedule", href: "/schedule", icon: "calendar" },
      { key: "broadcast", href: "/broadcast", icon: "broadcast" },
    ],
  },
  {
    title: "nav.groupSupport",
    items: [
      { key: "requests", href: "/requests", icon: "inbox" },
      { key: "faq", href: "/faq", icon: "help" },
      { key: "glossary", href: "/glossary", icon: "list" },
      { key: "contacts", href: "/contacts", icon: "users" },
      { key: "legal", href: "/legal", icon: "shield" },
    ],
  },
];

export const ALL_NAV: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/** Sections still under construction, with the stage they arrive in. */
export const PLACEHOLDER_SECTIONS: Record<string, string> = {
  venues: "venues",
  "camera-maps": "cameraMaps",
  schedule: "schedule",
  broadcast: "broadcast",
  requests: "requests",
};

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}
