// src/components/developer-nav-tabs.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { developerNavItems } from '@/lib/nav-config';

export default function DeveloperNavTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b">
      <nav className="flex space-x-2 lg:space-x-4 px-4 md:px-6" aria-label="Tabs">
        {developerNavItems.map(item => (
          <Link
            key={item.text}
            href={item.href}
            target={item.external ? '_blank' : '_self'}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap px-3 py-3.5 border-b-2 font-medium text-sm text-muted-foreground transition-all hover:border-primary hover:text-primary',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              pathname === item.href
                ? 'border-primary text-primary'
                : 'border-transparent',
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.text}
          </Link>
        ))}
      </nav>
    </div>
  );
}
