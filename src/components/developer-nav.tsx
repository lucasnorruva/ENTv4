// src/components/developer-nav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  KeyRound,
  Webhook,
  BarChart,
  History,
  Cog,
  Wrench,
  BookOpen,
  FileCode,
  LayoutDashboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navGroups = [
  {
    label: 'Dashboard',
    items: [
      {
        href: `/dashboard/developer`,
        icon: LayoutDashboard,
        text: 'Overview',
      },
    ],
  },
  {
    label: 'API & Services',
    items: [
      { href: `/dashboard/developer/keys`, icon: KeyRound, text: 'API Keys' },
      {
        href: `/dashboard/developer/webhooks`,
        icon: Webhook,
        text: 'Webhooks',
      },
      {
        href: `/dashboard/developer/integrations`,
        icon: Wrench,
        text: 'Integrations',
      },
      {
        href: `/dashboard/developer/api-settings`,
        icon: Cog,
        text: 'API Settings',
      },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      {
        href: `/dashboard/developer/analytics`,
        icon: BarChart,
        text: 'Analytics',
      },
      { href: `/dashboard/developer/logs`, icon: History, text: 'API Logs' },
    ],
  },
  {
    label: 'Resources',
    items: [
      {
        href: `/docs/api`,
        icon: FileCode,
        text: 'API Reference',
        external: true,
      },
      {
        href: `/docs`,
        icon: BookOpen,
        text: 'Documentation',
        external: true,
      },
    ],
  },
];

export default function DeveloperNav() {
  const pathname = usePathname();

  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {navGroups.map(group => (
        <div key={group.label} className="py-2">
          {group.label !== 'Dashboard' && (
            <h3 className="mb-2 px-4 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              {group.label}
            </h3>
          )}
          <div className="grid gap-1">
            {group.items.map(item => (
              <Link
                key={item.text}
                href={item.href}
                target={item.external ? '_blank' : '_self'}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                  pathname === item.href && 'bg-muted text-primary',
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.text}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
