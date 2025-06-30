// src/components/dashboard-shell.tsx
import React from 'react';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu, Search, Package2 } from 'lucide-react';
import type { Role, User } from '@/types';
import DashboardSidebar from './dashboard-sidebar';
import RoleSwitcher from './role-switcher';
import NotificationsPanel from './notifications-panel';
import { UserRoles } from '@/lib/constants';

interface DashboardShellProps {
  user: User;
  role: Role;
  children: React.ReactNode;
}

export default function DashboardShell({
  user,
  role,
  children,
}: DashboardShellProps) {
  // In a real app, available roles would come from the user's profile
  const availableRoles = Object.values(UserRoles);

  return (
    <SidebarProvider>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-muted/40 md:block">
           <DashboardSidebar user={user} userRole={role} />
        </div>
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 md:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col p-0">
                 <DashboardSidebar user={user} userRole={role} />
              </SheetContent>
            </Sheet>
            <div className="w-full flex-1">
              <RoleSwitcher roles={availableRoles} currentRole={role} />
            </div>
            <div className='flex items-center gap-4'>
                <NotificationsPanel user={user} />
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
             {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
