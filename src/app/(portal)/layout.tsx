import { AppShell } from "@/components/shell/AppShell";
import { requireApproved, isStaff, isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { NAV_GROUPS } from "@/lib/nav";
import { signOut } from "@/lib/actions/auth";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireApproved();
  const { t } = await getT();
  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id,title_en,title_tr,link,read_at,created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  const groups = [...NAV_GROUPS];
  if (isStaff(profile)) {
    groups.push({
      title: "admin.title",
      items: [
        { key: "admin.overview", href: "/admin", icon: "settings" },
        { key: "cms.title", href: "/admin/content", icon: "file" },
        { key: "import.title", href: "/admin/import", icon: "download" },
        ...(isAdmin(profile)
          ? [
              { key: "admin.users", href: "/admin/users", icon: "users" },
              { key: "admin.activity", href: "/admin/activity", icon: "activity" },
              { key: "admin.emails", href: "/admin/emails", icon: "mail" },
              { key: "admin.settings", href: "/admin/settings", icon: "settings" },
            ]
          : []),
      ],
    });
  }

  return (
    <AppShell
      groups={groups}
      notifications={notifications ?? []}
      userName={`${profile.first_name} ${profile.last_name}`}
      roleLabel={`${t(`admin.roles.${profile.role}`)} · ${profile.organization}`}
      staff={isStaff(profile)}
      signOut={signOut}
    >
      {children}
    </AppShell>
  );
}
