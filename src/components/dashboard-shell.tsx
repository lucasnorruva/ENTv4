// src/components/dashboard-shell.tsx
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
import { getCompanyById } from '@/lib/auth';

interface DashboardShellProps {
  user: User;
  role: Role;
  children: React.ReactNode;
}

export default async function DashboardShell({
  user,
  role,
  children,
}: DashboardShellProps) {
  const company = await getCompanyById(user.companyId);
  const theme = company?.settings?.theme;
  const useCustomTheme = company?.settings?.brandingCustomization && theme;

  const customThemeStyles = useCustomTheme
    ? `
    :root {
      ${theme.light?.primary ? `--primary: ${theme.light.primary};` : ''}
      ${theme.light?.accent ? `--accent: ${theme.light.accent};` : ''}
    }
    .dark {
      ${theme.dark?.primary ? `--primary: ${theme.dark.primary};` : ''}
      ${theme.dark?.accent ? `--accent: ${theme.dark.accent};` : ''}
    }
  `
    : '';

  return (
    <>
      {useCustomTheme && <style>{customThemeStyles}</style>}
      <SidebarProvider>
        <Sidebar>
          <DashboardSidebar userRole={role} user={user} />
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
