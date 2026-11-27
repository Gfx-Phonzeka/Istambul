import { Tabs } from "@/components/ui";

export function CrewTabs({ active, c, admin }: { active: "people" | "teams" | "functions" | "access"; c: (k: string) => string; admin: boolean }) {
  const items = [
    { key: "people", href: "/team/crew", label: c("tabPeople") },
    { key: "teams", href: "/team/crew/teams", label: c("tabTeams") },
    { key: "functions", href: "/team/crew/functions", label: c("tabFunctions") },
    ...(admin ? [{ key: "access", href: "/team/crew/access", label: c("tabAccess") }] : []),
  ];
  return <Tabs items={items.map((i) => ({ href: i.href, label: i.label, active: i.key === active }))} />;
}
