// src/components/dashboard-shell-client.tsx
'use client';

import React from 'react';
import type { User } from '@/types';
import type { Role } from '@/lib/constants';
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
} from '@/components/ui/sidebar';
import DashboardSidebar from './dashboard-sidebar';
import RoleSwitcher from './role-switcher';
import NotificationsPanel from './notifications-panel';
import GlobalSearchButton from './global-search-button';
import { ThemeToggle } from './theme-toggle';

interface DashboardShellClientProps {
  user: User;
  role: Role;
  children: React.ReactNode;
  logoUrl?: string;
  companyName?: string;
  customThemeStyles?: string;
}

export default function DashboardShellClient({
  user,
  role,
  children,
  logoUrl,
  companyName,
  customThemeStyles,
}: DashboardShellClientProps) {
  const useCustomTheme = !!customThemeStyles;
  return (
    <>
      {useCustomTheme && <style>{customThemeStyles}</style>}
      <SidebarProvider>
        <Sidebar>
          <DashboardSidebar
            userRole={role}
            user={user}
            logoUrl={logoUrl}
            companyName={companyName}
          />
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-4 shadow-sm backdrop-blur-sm sm:h-16 sm:px-6">
            <SidebarTrigger className="sm:hidden" />
            <div className="flex-1">
              <GlobalSearchButton user={user} role={role} />
            </div>
            <div className="flex items-center gap-2">
              <RoleSwitcher roles={user.roles} currentRole={role} />
              <NotificationsPanel user={user} />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
