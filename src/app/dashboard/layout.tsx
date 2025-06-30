import React from "react";
import type { Role } from "@/lib/constants";
import { UserRoles } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard-sidebar";
import RoleSwitcher from "@/components/role-switcher";
import NotificationsPanel from "@/components/notifications-panel";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
  searchParams,
}: {
  children: React.ReactNode;
  searchParams: { role?: Role };
}) {
  const selectedRole = searchParams?.role || UserRoles.SUPPLIER;
  const user = await getCurrentUser(selectedRole);
  const allRoles = Object.values(UserRoles);

  return (
    <SidebarProvider>
      <DashboardSidebar userRole={user.roles[0]} user={user} />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-6">
          <SidebarTrigger />
          <div className="flex-1" />

          <RoleSwitcher roles={allRoles} currentRole={user.roles[0]} />

          <NotificationsPanel user={user} />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
