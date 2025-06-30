// src/app/dashboard/layout.tsx
import React from 'react';
import { headers } from 'next/headers';
import type { Role } from '@/lib/constants';
import { UserRoles } from '@/lib/constants';
import { getCurrentUser } from '@/lib/auth';

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import DashboardSidebar from '@/components/dashboard-sidebar';
import RoleSwitcher from '@/components/role-switcher';
import NotificationsPanel from '@/components/notifications-panel';

export const dynamic = 'force-dynamic';

function getRoleFromPathname(pathname: string): Role {
  const segments = pathname.split('/').filter(Boolean);
  // The role should be the second segment, e.g., /dashboard/supplier -> 'supplier'
  const roleSegment = segments[1] || '';
  const role =
    Object.values(UserRoles).find(
      // Find the role that matches the slugified version
      r => r.toLowerCase().replace(/ /g, '-') === roleSegment,
    ) || UserRoles.SUPPLIER; // Default to supplier
  return role;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = headers().get('x-next-pathname') || '/dashboard/supplier';
  const selectedRole = getRoleFromPathname(pathname);
  const user = await getCurrentUser(selectedRole);
  const allRoles = Object.values(UserRoles);

  return (
    <SidebarProvider>
      <DashboardSidebar key={user.roles[0]} userRole={user.roles[0]} user={user} />
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