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
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { UserRoles, type Role } from "@/lib/constants";

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <LayoutGrid className="h-7 w-7 text-primary" />
      <h1 className="text-xl font-bold">PassportFlow</h1>
    </div>
  );
}

interface DashboardSidebarProps {
  userRole: Role;
}

const navConfig: Record<
  Role,
  { title: string; icon: React.ElementType; href: string }[]
> = {
  [UserRoles.ADMIN]: [
    { title: "Users", icon: Users, href: "#" },
    { title: "Compliance Rules", icon: FileQuestion, href: "#" },
    { title: "System Settings", icon: Settings, href: "#" },
  ],
  [UserRoles.SUPPLIER]: [
    { title: "My Products", icon: BookCopy, href: "#" },
    { title: "Upload History", icon: Code, href: "#" },
  ],
  [UserRoles.MANUFACTURER]: [
    { title: "Products", icon: BookCopy, href: "#" },
    { title: "Production Lines", icon: Factory, href: "#" },
  ],
  [UserRoles.AUDITOR]: [
    { title: "Audit Queue", icon: ShieldCheck, href: "#" },
    { title: "All Products", icon: BookCopy, href: "#" },
  ],
  [UserRoles.COMPLIANCE_MANAGER]: [
    { title: "Flagged Products", icon: ShieldCheck, href: "#" },
    { title: "Compliance Reports", icon: BarChart3, href: "#" },
  ],
  [UserRoles.BUSINESS_ANALYST]: [
    { title: "Analytics", icon: BarChart3, href: "#" },
    { title: "Data Export", icon: Code, href: "#" },
  ],
  [UserRoles.DEVELOPER]: [
    { title: "API Logs", icon: Code, href: "#" },
    { title: "Integrations", icon: Wrench, href: "#" },
  ],
  [UserRoles.RECYCLER]: [
    { title: "EOL Products", icon: Recycle, href: "#" },
    { title: "Recycling Reports", icon: BarChart3, href: "#" },
  ],
  [UserRoles.SERVICE_PROVIDER]: [
    { title: "Service Tickets", icon: Wrench, href: "#" },
    { title: "Product Manuals", icon: BookCopy, href: "#" },
  ],
};

export default function DashboardSidebar({ userRole }: DashboardSidebarProps) {
  const menuItems = navConfig[userRole] || [];

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} isActive={false}>
                <item.icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
