// src/components/dashboard-sidebar.tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid,
  Settings,
  LifeBuoy,
  LogOut,
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
  useSidebar,
} from '@/components/ui/sidebar';
import type { Role } from '@/lib/constants';
import type { User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { navConfig } from '@/lib/nav-config';

interface DashboardSidebarProps {
  userRole: Role;
  user: User;
  logoUrl?: string;
  companyName?: string;
}

export default function DashboardSidebar({
  userRole,
  user,
  logoUrl,
  companyName,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { toggleSidebar } = useSidebar();
  const menuConfig = navConfig[userRole] || [];
  const roleSlug = userRole.toLowerCase().replace(/ /g, '-');

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
      router.push(href);
    }
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
        toggleSidebar();
    }
  };

  const dashboardHref = `/dashboard/${roleSlug}`;

  const generalNavItems = [
    {
      title: 'Settings',
      icon: Settings,
      href: `/dashboard/${roleSlug}/settings`,
    },
    {
      title: 'Support',
      icon: LifeBuoy,
      href: `/dashboard/${roleSlug}/support`,
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo
          className="text-xl group-data-[collapsible=icon]:hidden"
          logoUrl={logoUrl}
          companyName={companyName}
        />
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
              {group.items.map(item => {
                const destination = item.external
                  ? item.href
                  : `/dashboard/${roleSlug}/${item.href}`;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => handleNavigate(destination, item.external)}
                      tooltip={item.title}
                      isActive={pathname.startsWith(destination) && !item.external}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
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
            <AvatarImage src={user.avatarUrl} />
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
