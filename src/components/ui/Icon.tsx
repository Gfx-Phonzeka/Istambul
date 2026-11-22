// Simple stroke icons (24×24). Replaceable in phase 2.
const paths: Record<string, string> = {
  home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  play: "M5 4l14 8-14 8z",
  download: "M12 3v12m0 0l-5-5m5 5l5-5M4 19h16",
  book: "M4 4h7a3 3 0 013 3v13a2 2 0 00-2-2H4zM20 4h-7a3 3 0 00-3 3v13a2 2 0 012-2h8z",
  pin: "M12 21s-7-6.5-7-12a7 7 0 0114 0c0 5.5-7 12-7 12zm0-9a3 3 0 100-6 3 3 0 000 6z",
  camera: "M3 7h4l2-3h6l2 3h4v13H3zM12 17a4 4 0 100-8 4 4 0 000 8z",
  calendar: "M4 5h16v16H4zM4 9h16M8 3v4M16 3v4",
  broadcast: "M12 12v9M8 21h8M5.6 5.6a9 9 0 0112.8 0M8.5 8.5a5 5 0 017 0M12 12h0",
  inbox: "M4 4h16v16H4zM4 14h5l1 2h4l1-2h5",
  help: "M12 21a9 9 0 100-18 9 9 0 000 18zM9.5 9a2.5 2.5 0 115 .5c0 1.5-2.5 2-2.5 3.5M12 17h0",
  list: "M8 6h13M8 12h13M8 18h13M3 6h0M3 12h0M3 18h0",
  users: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8",
  megaphone: "M3 11v2a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1zM15 8a5 5 0 010 8M18 5a9 9 0 010 14",
  file: "M14 3H6v18h12V7zM14 3v4h4",
  bell: "M18 16V11a6 6 0 10-12 0v5l-2 2h16zM10 21h4",
  user: "M20 21a8 8 0 00-16 0M12 13a5 5 0 100-10 5 5 0 000 10z",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z",
  menu: "M3 6h18M3 12h18M3 18h18",
  "chevron-down": "M6 9l6 6 6-6",
  close: "M6 6l12 12M18 6L6 18",
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3",
  logout: "M9 21H5V3h4M16 17l5-5-5-5M21 12H9",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  activity: "M3 12h4l3-8 4 16 3-8h4",
  mail: "M3 5h18v14H3zM3 6l9 7 9-7",
  more: "M5 12h0M12 12h0M19 12h0",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 3",
  alert: "M12 3l10 18H2zM12 10v4M12 18h0",
};

export type IconName = keyof typeof paths;

export function Icon({ name, size = 20, className }: { name: IconName | string; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={paths[name] ?? paths.file} />
    </svg>
  );
}
