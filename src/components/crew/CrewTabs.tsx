import { Tabs } from "@/components/ui";
import { isCrewFinance } from "@/lib/crew-server";

type Key = "people" | "teams" | "units" | "days" | "service" | "travel" | "hotels" | "transfers" | "costs" | "functions" | "access";
export async function CrewTabs({ active, c, admin }: { active: Key; c: (k: string) => string; admin: boolean }) {
  const finance = await isCrewFinance();
  const items = [
    { key: "people", href: "/team/crew", label: c("tabPeople") },
    { key: "teams", href: "/team/crew/teams", label: c("tabTeams") },
    { key: "units", href: "/team/crew/units", label: c("tabUnits") },
    { key: "days", href: "/team/crew/days", label: c("tabDays") },
    { key: "service", href: "/team/crew/service", label: c("tabService") },
    { key: "travel", href: "/team/crew/travel", label: c("tabTravel") },
    { key: "hotels", href: "/team/crew/hotels", label: c("tabHotels") },
    { key: "transfers", href: "/team/crew/transfers", label: c("tabTransfers") },
    ...(finance ? [{ key: "costs", href: "/team/crew/costs", label: c("tabCosts") }] : []),
    { key: "functions", href: "/team/crew/functions", label: c("tabFunctions") },
    ...(admin ? [{ key: "access", href: "/team/crew/access", label: c("tabAccess") }] : []),
  ];
  return <Tabs items={items.map((i) => ({ href: i.href, label: i.label, active: i.key === active }))} />;
}
