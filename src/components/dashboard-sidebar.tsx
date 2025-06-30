// src/components/dashboard-sidebar.tsx
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
  ClipboardCheck,
} from 'lucide-react';
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
} from '@/components/ui/sidebar';
import { UserRoles, type Role } from '@/lib/constants';
import type { User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

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

const getRoleSlug = (role: Role) => role.toLowerCase().replace(/ /g, '-');

const navConfig: Record<Role, NavConfig> = {
  [UserRoles.ADMIN]: [
    {
      label: 'Platform Management',
      items: [
        { title: 'Analytics', icon: BarChart3, href: 'analytics' },
        { title: 'Users', icon: Users, href: 'users' },
        { title: 'Companies', icon: Building2, href: 'companies' },
        {
          title: 'All Products',
          icon: BookCopy,
          href: 'products',
        },
        {
          title: 'Compliance Paths',
          icon: FileQuestion,
          href: 'compliance',
        },
      ],
    },
    {
      label: 'System Configuration',
      items: [
        { title: 'API Settings', icon: Cog, href: 'api-settings' },
        {
          title: 'Integrations',
          icon: Wrench,
          href: 'integrations',
        },
      ],
    },
  ],
  [UserRoles.SUPPLIER]: [
    {
      label: 'Passport Management',
      items: [
        {
          title: 'Manage Products',
          icon: BookCopy,
          href: 'products',
        },
        {
          title: 'Compliance Report',
          icon: ShieldCheck,
          href: 'compliance',
        },
        {
          title: 'Data Quality',
          icon: ClipboardCheck,
          href: 'data-quality',
        },
      ],
    },
    {
      label: 'Account',
      items: [{ title: 'Activity History', icon: Clock, href: 'history' }],
    },
  ],
  [UserRoles.MANUFACTURER]: [
    {
      label: 'Production',
      items: [
        { title: 'All Products', icon: BookCopy, href: 'products' },
        { title: 'Production Lines', icon: Factory, href: 'lines' },
      ],
    },
    {
      label: 'Analysis',
      items: [
        {
          title: 'Material Composition',
          icon: Package,
          href: 'composition',
        },
        {
          title: 'Analytics',
          icon: BarChart3,
          href: 'analytics',
        },
      ],
    },
  ],
  [UserRoles.AUDITOR]: [
    {
      label: 'Auditing',
      items: [
        { title: 'Audit Queue', icon: ShieldCheck, href: 'audit' },
        { title: 'All Products', icon: BookCopy, href: 'products' },
      ],
    },
    {
      label: 'Reference',
      items: [
        {
          title: 'Compliance Paths',
          icon: FileQuestion,
          href: 'compliance',
        },
        { title: 'Reports', icon: FileText, href: 'reports' },
      ],
    },
  ],
  [UserRoles.COMPLIANCE_MANAGER]: [
    {
      label: 'Compliance',
      items: [
        {
          title: 'Flagged Products',
          icon: ShieldAlert,
          href: 'flagged',
        },
        {
          title: 'Compliance Paths',
          icon: FileQuestion,
          href: 'compliance',
        },
      ],
    },
    {
      label: 'Reference',
      items: [
        {
          title: 'All Products',
          icon: BookCopy,
          href: 'products',
        },
        {
          title: 'Compliance Reports',
          icon: FileText,
          href: 'reports',
        },
      ],
    },
  ],
  [UserRoles.BUSINESS_ANALYST]: [
    {
      label: 'Analytics',
      items: [
        {
          title: 'System Analytics',
          icon: BarChart3,
          href: 'analytics',
        },
        {
          title: 'Sustainability Metrics',
          icon: Recycle,
          href: 'sustainability',
        },
        {
          title: 'Material Composition',
          icon: Package,
          href: 'composition',
        },
        { title: 'Data Export', icon: FileDown, href: 'export' },
      ],
    },
  ],
  [UserRoles.DEVELOPER]: [
    {
      label: 'Configuration',
      items: [
        { title: 'API Keys', icon: KeyRound, href: 'keys' },
        {
          title: 'API Settings',
          icon: Cog,
          href: 'api-settings',
        },
        {
          title: 'Integrations',
          icon: Wrench,
          href: 'integrations',
        },
      ],
    },
    {
      label: 'Monitoring',
      items: [{ title: 'API Logs', icon: FileText, href: 'logs' }],
    },
    {
      label: 'Resources',
      items: [
        {
          title: 'API Documentation',
          icon: FileCode,
          href: '/docs/api',
          external: true,
        },
      ],
    },
  ],
  [UserRoles.RECYCLER]: [
    {
      label: 'Operations',
      items: [
        { title: 'EOL Products', icon: Recycle, href: 'eol' },
      ],
    },
    {
      label: 'Analysis',
      items: [
        {
          title: 'Material Composition',
          icon: Package,
          href: 'composition',
        },
        {
          title: 'Analytics',
          icon: BarChart3,
          href: 'analytics',
        },
      ],
    },
  ],
  [UserRoles.SERVICE_PROVIDER]: [
    {
      label: 'Operations',
      items: [
        { title: 'Service Tickets', icon: Ticket, href: 'tickets' },
        { title: 'Product Manuals', icon: BookCopy, href: 'manuals' },
      ],
    },
    {
      label: 'Analysis',
      items: [
        {
          title: 'Analytics',
          icon: BarChart3,
          href: 'analytics',
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
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const menuConfig = navConfig[userRole] || [];
  const roleSlug = getRoleSlug(userRole);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout Failed:', error);
      toast({
        title: 'Logout Failed',
        description: 'An error occurred while logging out.',
        variant: 'destructive',
      });
    }
  };

  const handleNavigate = (href: string, external?: boolean) => {
    if (external) {
      window.open(href, '_blank');
    } else {
      const currentRole = searchParams.get('role');
      const destination = currentRole ? `${href}?role=${currentRole}` : href;
      router.push(destination);
    }
  };

  const dashboardHref = `/dashboard/${roleSlug}`;

  const generalNavItems = [
    { title: 'Settings', icon: Settings, href: `/dashboard/${roleSlug}/settings` },
    { title: 'Support', icon: LifeBuoy, href: `/dashboard/${roleSlug}/support` },
  ];

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

        {menuConfig.map(group => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() =>
                      handleNavigate(
                        item.external ? item.href : `/dashboard/${roleSlug}/${item.href}`,
                        item.external,
                      )
                    }
                    tooltip={item.title}
                    isActive={pathname.startsWith(`/dashboard/${roleSlug}/${item.href}`) && !item.external}
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
            {generalNavItems.map(item => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  onClick={() => handleNavigate(item.href)}
                  tooltip={item.title}
                  isActive={pathname === item.href}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
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
