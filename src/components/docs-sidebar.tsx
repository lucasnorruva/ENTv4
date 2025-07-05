'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

const docsConfig = {
  mainNav: [
    {
      title: 'Introduction',
      href: '/docs',
    },
    {
      title: 'Platform Architecture',
      href: '/docs/platform-architecture',
    },
  ],
  sidebarNav: [
    {
      title: 'Overview',
      items: [
        {
          title: 'Introduction',
          href: '/docs',
        },
        {
          title: 'Development Roadmap',
          href: '/docs/roadmap',
        },
        {
          title: 'Contributing Guide',
          href: '/docs/contributing',
        },
      ],
    },
    {
      title: 'Platform',
      items: [
        {
          title: 'Platform Architecture',
          href: '/docs/platform-architecture',
        },
        {
          title: 'Business Logic Flows',
          href: '/docs/business-logic-flows',
        },
        {
          title: 'User Roles & Permissions',
          href: '/docs/roles',
        },
        {
          title: 'CI/CD & Versioning',
          href: '/docs/versioning',
        },
      ],
    },
    {
      title: 'Core Concepts',
      items: [
        {
          title: 'DPP Methodology',
          href: '/docs/dpp-methodology',
        },
        {
          title: 'Compliance Matrix',
          href: '/docs/compliance-matrix',
        },
        {
          title: 'AI Prompt Design',
          href: '/docs/ai-prompt-design',
        },
        {
          title: 'Internationalization',
          href: '/docs/internationalization',
        },
      ],
    },
    {
      title: 'Integrations & API',
      items: [
        {
          title: 'API Specification',
          href: '/docs/api',
        },
        {
          title: 'Enterprise Integration',
          href: '/docs/integrations',
        },
        {
          title: 'Blockchain Strategy',
          href: '/docs/blockchain',
        },
      ],
    },
    {
      title: 'Strategy',
      items: [
        {
          title: 'Funding & Governance',
          href: '/docs/funding-and-governance',
        },
        {
          title: 'Future Innovations',
          href: '/docs/innovations',
        },
      ],
    },
  ],
};

interface DocsSidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export default function DocsSidebar({ className }: DocsSidebarProps) {
  const pathname = usePathname();

  return (
    <ScrollArea className={cn('h-full', className)}>
      <div className="pb-10">
        {docsConfig.sidebarNav.map((group, index) => (
          <div
            key={index}
            className={cn('pb-4', {
              'pb-0': index === docsConfig.sidebarNav.length - 1,
            })}
          >
            <h4 className="mb-1 rounded-md px-2 py-1 text-sm font-semibold">
              {group.title}
            </h4>
            {group.items?.length && (
              <DocsSidebarNavItems items={group.items} pathname={pathname} />
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

interface DocsSidebarNavItemsProps {
  items: { title: string; href: string }[];
  pathname: string | null;
}

export function DocsSidebarNavItems({
  items,
  pathname,
}: DocsSidebarNavItemsProps) {
  return items?.length ? (
    <div className="grid grid-flow-row auto-rows-max text-sm">
      {items.map((item, index) => (
        <Link
          key={index}
          href={item.href}
          className={cn(
            'group flex w-full items-center rounded-md border border-transparent px-2 py-1 hover:underline',
            item.href === pathname
              ? 'font-medium text-foreground'
              : 'text-muted-foreground',
          )}
        >
          {item.title}
        </Link>
      ))}
    </div>
  ) : null;
}
