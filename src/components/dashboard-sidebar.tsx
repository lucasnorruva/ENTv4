
// src/components/dashboard-sidebar.tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutGrid,
  BookCopy,
  ShieldCheck,
  Settings,
  Users,
  BarChart3,
  Recycle,
  Factory,
  Wrench,
  FileQuestion,
  Clock,
  KeyRound,
  FileText,
  LifeBuoy,
  LogOut,
  FileDown,
  Ticket,
  Package,
  ShieldAlert,
  FileCode,
  Cog,
  Building2,
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
  external?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

type NavConfig = NavGroup[];

const navConfig: Record<Role, NavConfig> = {
  [UserRoles.ADMIN]: [
    {
      label: "Overview",
      items: [
        {
          title: "System Analytics",
          icon: BarChart3,
          href: "/dashboard/analytics",
        },
      ],
    },
    {
      label: "Platform Management",
      items: [
        { title: "Users", icon: Users, href: "/dashboard/users" },
        { title: "Companies", icon: Building2, href: "/dashboard/companies" },
        {
          title: "All Products",
          icon: BookCopy,
          href: "/dashboard/products",
        },
        {
          title: "Compliance Paths",
          icon: FileQuestion,
          href: "/dashboard/compliance",
        },
      ],
    },
    {
      label: "System Configuration",
      items: [
        { title: "API Settings", icon: Cog, href: "/dashboard/api-settings" },
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
        { title: "All Products", icon: BookCopy, href: "/dashboard/products" },
        { title: "Production Lines", icon: Factory, href: "/dashboard/lines" },
      ],
    },
    {
      label: "Analysis",
      items: [
        {
          title: "Material Composition",
          icon: Package,
          href: "/dashboard/composition",
        },
        {
          title: "Analytics",
          icon: BarChart3,
          href: "/dashboard/analytics",
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
      ],
    },
    {
      label: "Reference",
      items: [
        {
          title: "Compliance Paths",
          icon: FileQuestion,
          href: "/dashboard/compliance",
        },
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
          icon: ShieldAlert,
          href: "/dashboard/flagged",
        },
        {
          title: "Compliance Paths",
          icon: FileQuestion,
          href: "/dashboard/compliance",
        },
      ],
    },
    {
      label: "Reference",
      items: [
        {
          title: "All Products",
          icon: BookCopy,
          href: "/dashboard/products",
        },
        {
          title: "Compliance Reports",
          icon: FileText,
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
        {
          title: "Material Composition",
          icon: Package,
          href: "/dashboard/composition",
        },
        { title: "Data Export", icon: FileDown, href: "/dashboard/export" },
      ],
    },
  ],
  [UserRoles.DEVELOPER]: [
    {
      label: "Configuration",
      items: [
        { title: "API Keys", icon: KeyRound, href: "/dashboard/keys" },
        {
          title: "API Settings",
          icon: Cog,
          href: "/dashboard/api-settings",
        },
        {
          title: "Integrations",
          icon: Wrench,
          href: "/dashboard/integrations",
        },
      ],
    },
    {
      label: "Monitoring",
      items: [{ title: "API Logs", icon: FileText, href: "/dashboard/logs" }],
    },
    {
      label: "Resources",
      items: [
        {
          title: "API Documentation",
          icon: FileCode,
          href: "/docs/api",
          external: true,
        },
      ],
    },
  ],
  [UserRoles.RECYCLER]: [
    {
      label: "Operations",
      items: [
        { title: "EOL Products", icon: Recycle, href: "/dashboard/eol" },
      ],
    },
    {
      label: "Analysis",
      items: [
        {
          title: "Material Composition",
          icon: Package,
          href: "/dashboard/composition",
        },
        {
          title: "Analytics",
          icon: BarChart3,
          href: "/dashboard/analytics",
        },
      ],
    },
  ],
  [UserRoles.SERVICE_PROVIDER]: [
    {
      label: "Operations",
      items: [
        { title: "Service Tickets", icon: Ticket, href: "/dashboard/tickets" },
        { title: "Product Manuals", icon: BookCopy, href: "/dashboard/manuals" },
      ],
    },
    {
      label: "Analysis",
      items: [
        {
          title: "Analytics",
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

const getRoleSlug = (role: Role) => role.toLowerCase().replace(/ /g, '-');

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

  const handleNavigate = (href: string, external?: boolean) => {
    if (external) {
      window.open(href, "_blank");
    } else {
      router.push(href);
    }
  };

  const dashboardHref = `/dashboard/${getRoleSlug(userRole)}`;

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo className="text-xl group-data-[collapsible=icon]:hidden" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleNavigate(dashboardHref)}
              tooltip="Dashboard"
              isActive={pathname === dashboardHref}
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
                    onClick={() => handleNavigate(item.href, item.external)}
                    tooltip={item.title}
                    isActive={pathname.startsWith(item.href) && !item.external}
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
                onClick={() => handleNavigate("/dashboard/settings")}
                tooltip="Settings"
                isActive={pathname === "/dashboard/settings"}
              >
                <Settings />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleNavigate("/dashboard/support")}
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
