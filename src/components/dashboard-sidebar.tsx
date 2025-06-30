// src/components/dashboard-sidebar.tsx
"use client";

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
        { title: "Users", icon: Users, href: "#" },
        { title: "Compliance Rules", icon: FileQuestion, href: "#" },
        { title: "System Analytics", icon: BarChart3, href: "#" },
      ],
    },
    {
      label: "Configuration",
      items: [
        { title: "API Settings", icon: Code, href: "#" },
        { title: "Integrations", icon: Wrench, href: "#" },
      ],
    },
  ],
  [UserRoles.SUPPLIER]: [
    {
      label: "My Passports",
      items: [
        { title: "All Products", icon: BookCopy, href: "#" },
        { title: "Create New", icon: PlusCircle, href: "#" },
        { title: "Upload History", icon: Clock, href: "#" },
      ],
    },
  ],
  [UserRoles.MANUFACTURER]: [
    {
      label: "Production",
      items: [
        { title: "Products", icon: BookCopy, href: "#" },
        { title: "Production Lines", icon: Factory, href: "#" },
        { title: "Component Traceability", icon: BarChart3, href: "#" },
      ],
    },
  ],
  [UserRoles.AUDITOR]: [
    {
      label: "Auditing",
      items: [
        { title: "Audit Queue", icon: ShieldCheck, href: "#" },
        { title: "All Products", icon: BookCopy, href: "#" },
        { title: "Reports", icon: FileText, href: "#" },
      ],
    },
  ],
  [UserRoles.COMPLIANCE_MANAGER]: [
    {
      label: "Compliance",
      items: [
        { title: "Flagged Products", icon: ShieldCheck, href: "#" },
        { title: "Compliance Reports", icon: BarChart3, href: "#" },
      ],
    },
  ],
  [UserRoles.BUSINESS_ANALYST]: [
    {
      label: "Analytics",
      items: [
        { title: "Product Trends", icon: BarChart3, href: "#" },
        { title: "Sustainability Metrics", icon: Recycle, href: "#" },
        { title: "Data Export", icon: Code, href: "#" },
      ],
    },
  ],
  [UserRoles.DEVELOPER]: [
    {
      label: "Development",
      items: [
        { title: "API Logs", icon: Code, href: "#" },
        { title: "Integrations", icon: Wrench, href: "#" },
        { title: "API Keys", icon: KeyRound, href: "#" },
      ],
    },
  ],
  [UserRoles.RECYCLER]: [
    {
      label: "Recycling",
      items: [
        { title: "EOL Products", icon: Recycle, href: "#" },
        { title: "Recycling Reports", icon: BarChart3, href: "#" },
        { title: "Material Composition", icon: FileText, href: "#" },
      ],
    },
  ],
  [UserRoles.SERVICE_PROVIDER]: [
    {
      label: "Services",
      items: [
        { title: "Service Tickets", icon: Wrench, href: "#" },
        { title: "Product Manuals", icon: BookCopy, href: "#" },
        { title: "Repair Analytics", icon: BarChart3, href: "#" },
      ],
    },
  ],
};

const generalNav: NavGroup[] = [
  {
    label: "General",
    items: [
      { title: "Settings", icon: Settings, href: "#" },
      { title: "Support", icon: LifeBuoy, href: "#" },
    ],
  },
];

interface DashboardSidebarProps {
  userRole: Role;
  user: User;
}

export default function DashboardSidebar({
  userRole,
  user,
}: DashboardSidebarProps) {
  const menuConfig = navConfig[userRole] || [];

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo className="text-xl group-data-[collapsible=icon]:hidden" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton href="#" tooltip="Dashboard" isActive={true}>
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
                  <SidebarMenuButton href={item.href} tooltip={item.title}>
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
              <SidebarMenuButton href="#" tooltip="Settings">
                <Settings />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="#" tooltip="Support">
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
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
