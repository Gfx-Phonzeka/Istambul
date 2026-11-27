import { Tabs } from "@/components/ui";

type Key = "people" | "teams" | "units" | "days" | "service" | "functions" | "access";
export function CrewTabs({ active, c, admin }: { active: Key; c: (k: string) => string; admin: boolean }) {
  const items = [
    { key: "people", href: "/team/crew", label: c("tabPeople") },
    { key: "teams", href: "/team/crew/teams", label: c("tabTeams") },
    { key: "units", href: "/team/crew/units", label: c("tabUnits") },
    { key: "days", href: "/team/crew/days", label: c("tabDays") },
    { key: "service", href: "/team/crew/service", label: c("tabService") },
    { key: "functions", href: "/team/crew/functions", label: c("tabFunctions") },
    ...(admin ? [{ key: "access", href: "/team/crew/access", label: c("tabAccess") }] : []),
  ];
  return <Tabs items={items.map((i) => ({ href: i.href, label: i.label, active: i.key === active }))} />;
}
