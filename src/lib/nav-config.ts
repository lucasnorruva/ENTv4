// src/lib/nav-config.ts
import {
  BookCopy,
  ShieldCheck,
  BarChart3,
  Recycle,
  Factory,
  Wrench,
  FileQuestion,
  Clock,
  KeyRound,
  FileText,
  FileCode,
  Cog,
  BookOpen,
  Users,
  Webhook,
  Globe,
  Scale,
  LifeBuoy,
  Ticket,
} from 'lucide-react';
import { UserRoles, type Role } from './constants';

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

type NavConfig = Record<Role, NavGroup[]>;

export const developerNavItems = [
  {
    href: `/dashboard/developer`,
    icon: BookOpen,
    text: 'Dashboard',
  },
  { href: `/dashboard/developer/keys`, icon: KeyRound, text: 'API Keys' },
  { href: `/dashboard/developer/webhooks`, icon: Webhook, text: 'Webhooks' },
  {
    href: `/docs`,
    icon: FileCode,
    text: 'Documentation',
    external: true,
  },
  {
    href: `/dashboard/developer/logs`,
    icon: FileText,
    text: 'Logs',
  },
  {
    href: `/dashboard/developer/settings`,
    icon: Cog,
    text: 'Settings',
  },
];

export const navConfig: NavConfig = {
  [UserRoles.ADMIN]: [
    {
      label: 'Platform Management',
      items: [
        { title: 'Users', icon: Users, href: 'users' },
        { title: 'Companies', icon: KeyRound, href: 'companies' },
        {
          title: 'Compliance Paths',
          icon: FileQuestion,
          href: 'compliance',
        },
        { title: 'Platform Logs', icon: Clock, href: 'logs' },
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
    {
      label: 'Monitoring & Operations',
      items: [
        { title: 'Global Tracker', icon: Globe, href: 'global-tracker' },
        {
          title: 'Customs Requirements',
          icon: Scale,
          href: 'customs',
        },
        {
          title: 'Service Tickets',
          icon: Wrench,
          href: 'service-tickets',
        },
        {
          title: 'Support Tickets',
          icon: Ticket,
          href: 'tickets',
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
          title: 'Compliance Status',
          icon: ShieldCheck,
          href: 'compliance',
        },
      ],
    },
    {
      label: 'Analysis',
      items: [{ title: 'Analytics', icon: BarChart3, href: 'analytics' }],
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
      items: [{ title: 'Analytics', icon: BarChart3, href: 'analytics' }],
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
          icon: ShieldCheck,
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
  [UserRoles.RETAILER]: [], // Placeholder, will be built out
  [UserRoles.BUSINESS_ANALYST]: [], // Placeholder, will be built out
  [UserRoles.DEVELOPER]: [], // Uses a different layout/nav
  [UserRoles.RECYCLER]: [
    {
      label: 'Operations',
      items: [{ title: 'EOL Products', icon: Recycle, href: 'eol' }],
    },
  ],
  [UserRoles.SERVICE_PROVIDER]: [
    {
      label: 'Operations',
      items: [{ title: 'Service Tickets', icon: Wrench, href: 'tickets' }],
    },
  ],
};
