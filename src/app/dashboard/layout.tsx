import React from "react";
import { Bell, Search, UserCircle } from "lucide-react";
import type { Role } from "@/lib/constants";
import { UserRoles } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import RoleSwitcher from "@/components/role-switcher";
import SWRegister from "@/components/sw-register";

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
      <DashboardSidebar userRole={user.roles[0]} />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search passports..." className="pl-9" />
          </div>

          <RoleSwitcher roles={allRoles} currentRole={user.roles[0]} />

          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <UserCircle className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.fullName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-6">{children}</main>
        <SWRegister />
      </SidebarInset>
    </SidebarProvider>
  );
}
