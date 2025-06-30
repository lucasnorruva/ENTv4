// src/components/dashboard-sidebar.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  BookCopy,
  ShieldCheck,
  Code,
  Settings,
  Users,
  BarChart3,
  Recycle,
  Factory,
  Wrench,
  FileQuestion,
  PlusCircle,
  Clock,
  KeyRound,
  FileText,
  LifeBuoy,
  LogOut,
  FileDown,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { UserRoles, type Role } from "@/lib/constants";
import type { User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Logo from "@/components/logo";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface NavItem {
  title: string;
  icon: React.ElementType;
  href: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

type NavConfig = NavGroup[];

const navConfig: Record<Role, NavConfig> = {
  [UserRoles.ADMIN]: [
    {
      label: "Management",
      items: [
        { title: "Users", icon: Users, href: "/dashboard/users" },
        {
          title: "Compliance Paths",
          icon: FileQuestion,
          href: "/dashboard/compliance",
        },
        {
          title: "System Analytics",
          icon: BarChart3,
          href: "/dashboard/analytics",
        },
      ],
    },
    {
      label: "Configuration",
      items: [
        { title: "API Settings", icon: Code, href: "/dashboard/api-settings" },
        {
          title: "Integrations",
          icon: Wrench,
          href: "/dashboard/integrations",
        },
      ],
    },
  ],
  [UserRoles.SUPPLIER]: [
    {
      label: "My Passports",
      items: [
        {
          title: "Manage Products",
          icon: BookCopy,
          href: "/dashboard/products",
        },
        { title: "Activity History", icon: Clock, href: "/dashboard/history" },
      ],
    },
  ],
  [UserRoles.MANUFACTURER]: [
    {
      label: "Production",
      items: [
        { title: "Products", icon: BookCopy, href: "/dashboard/products" },
        { title: "Production Lines", icon: Factory, href: "/dashboard/lines" },
        {
          title: "Component Traceability",
          icon: BarChart3,
          href: "/dashboard/traceability",
        },
      ],
    },
  ],
  [UserRoles.AUDITOR]: [
    {
      label: "Auditing",
      items: [
        { title: "Audit Queue", icon: ShieldCheck, href: "/dashboard/audit" },
        { title: "All Products", icon: BookCopy, href: "/dashboard/products" },
        { title: "Reports", icon: FileText, href: "/dashboard/reports" },
      ],
    },
  ],
  [UserRoles.COMPLIANCE_MANAGER]: [
    {
      label: "Compliance",
      items: [
        {
          title: "Flagged Products",
          icon: ShieldCheck,
          href: "/dashboard/flagged",
        },
        {
          title: "Compliance Reports",
          icon: BarChart3,
          href: "/dashboard/reports",
        },
      ],
    },
  ],
  [UserRoles.BUSINESS_ANALYST]: [
    {
      label: "Analytics",
      items: [
        {
          title: "System Analytics",
          icon: BarChart3,
          href: "/dashboard/analytics",
        },
        {
          title: "Sustainability Metrics",
          icon: Recycle,
          href: "/dashboard/sustainability",
        },
        { title: "Data Export", icon: FileDown, href: "/dashboard/export" },
      ],
    },
  ],
  [UserRoles.DEVELOPER]: [
    {
      label: "Development",
      items: [
        { title: "API Logs", icon: Code, href: "/dashboard/logs" },
        {
          title: "Integrations",
          icon: Wrench,
          href: "/dashboard/integrations",
        },
        { title: "API Keys", icon: KeyRound, href: "/dashboard/keys" },
      ],
    },
  ],
  [UserRoles.RECYCLER]: [
    {
      label: "Recycling",
      items: [
        { title: "EOL Products", icon: Recycle, href: "/dashboard/eol" },
        {
          title: "Recycling Reports",
          icon: BarChart3,
          href: "/dashboard/reports",
        },
        {
          title: "Material Composition",
          icon: FileText,
          href: "/dashboard/composition",
        },
      ],
    },
  ],
  [UserRoles.SERVICE_PROVIDER]: [
    {
      label: "Services",
      items: [
        { title: "Service Tickets", icon: Wrench, href: "/dashboard/tickets" },
        { title: "Product Manuals", icon: BookCopy, href: "/dashboard/manuals" },
        {
          title: "Repair Analytics",
          icon: BarChart3,
          href: "/dashboard/analytics",
        },
      ],
    },
  ],
};

interface DashboardSidebarProps {
  userRole: Role;
  user: User;
}

export default function DashboardSidebar({
  userRole,
  user,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const menuConfig = navConfig[userRole] || [];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: "An error occurred while logging out.",
        variant: "destructive",
      });
    }
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo className="text-xl group-data-[collapsible=icon]:hidden" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              href="/dashboard"
              tooltip="Dashboard"
              isActive={pathname === "/dashboard"}
            >
              <LayoutGrid />
              <span>Dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {menuConfig.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    href={item.href}
                    tooltip={item.title}
                    isActive={pathname.startsWith(item.href)}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}

        <SidebarGroup>
          <SidebarGroupLabel>General</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                href="/dashboard/settings"
                tooltip="Settings"
                isActive={pathname === "/dashboard/settings"}
              >
                <Settings />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                href="/dashboard/support"
                tooltip="Support"
                isActive={pathname === "/dashboard/support"}
              >
                <LifeBuoy />
                <span>Support</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <SidebarSeparator />
        <div className="p-2 flex items-center gap-3">
          <Avatar>
            <AvatarImage src={`https://i.pravatar.cc/150?u=${user.id}`} />
            <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="font-semibold text-sm truncate">{user.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
