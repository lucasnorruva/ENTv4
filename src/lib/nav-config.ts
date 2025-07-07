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
  Building2,
  Ticket,
  Package,
  ShieldAlert,
  ListChecks,
  Users,
  Webhook,
  ShoppingBag,
  Globe,
  LifeBuoy,
  Landmark,
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

export const navConfig: NavConfig = {
  [UserRoles.ADMIN]: [
    {
      label: 'Platform Management',
      items: [
        { title: 'Users', icon: Users, href: 'users' },
        { title: 'Companies', icon: Building2, href: 'companies' },
        { title: 'All Products', icon: BookCopy, href: 'products' },
        {
          title: 'Compliance Paths',
          icon: FileQuestion,
          href: 'compliance',
        },
        { title: 'Platform Logs', icon: Clock, href: 'logs' },
        { title: 'Analytics', icon: BarChart3, href: 'analytics' },
        { title: 'Service Tickets', icon: Wrench, href: 'service-tickets' },
        { title: 'Support Tickets', icon: Ticket, href: 'tickets' },
      ],
    },
    {
      label: 'Supply Chain',
      items: [
        { title: 'Global Tracker', icon: Globe, href: 'global-tracker' },
        { title: 'Customs Info', icon: Landmark, href: 'customs' },
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
          title: 'Compliance Status',
          icon: ShieldCheck,
          href: 'compliance',
        },
        {
          title: 'Data Quality',
          icon: ListChecks,
          href: 'data-quality',
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
        { title: 'Service Tickets', icon: Ticket, href: 'tickets' },
      ],
    },
    {
      label: 'Supply Chain',
      items: [
        { title: 'Global Tracker', icon: Globe, href: 'global-tracker' },
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
        { title: 'Analytics', icon: BarChart3, href: 'analytics' },
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
        { title: 'Customs Info', icon: Landmark, href: 'customs' },
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
        { title: 'Analytics', icon: BarChart3, href: 'analytics' },
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
  [UserRoles.RETAILER]: [
    {
      label: 'Retail Operations',
      items: [
        { title: 'Product Catalog', icon: ShoppingBag, href: 'catalog' },
        { title: 'Supplier Analytics', icon: BarChart3, href: 'analytics' },
      ],
    },
     {
      label: 'Supply Chain',
      items: [
        { title: 'Global Tracker', icon: Globe, href: 'global-tracker' },
      ],
    },
  ],
  [UserRoles.BUSINESS_ANALYST]: [
    {
      label: 'Analysis',
      items: [
        { title: 'Analytics', icon: BarChart3, href: 'analytics' },
        { title: 'Sustainability', icon: Recycle, href: 'sustainability' },
        { title: 'Composition', icon: Package, href: 'composition' },
        { title: 'Data Export', icon: FileText, href: 'export' },
      ],
    },
  ],
  [UserRoles.DEVELOPER]: [
    {
      label: 'API & Services',
      items: [
        { title: 'API Keys', icon: KeyRound, href: 'keys' },
        { title: 'Webhooks', icon: Webhook, href: 'webhooks' },
        { title: 'Integrations', icon: Wrench, href: 'integrations' },
        { title: 'API Settings', icon: Cog, href: 'api-settings' },
      ]
    },
    {
      label: 'Monitoring',
      items: [
        { title: 'API Logs', icon: History, href: 'logs' },
        { title: 'Analytics', icon: BarChart3, href: 'analytics' },
      ],
    },
    {
      label: 'Resources',
      items: [
        { title: 'API Reference', icon: FileCode, href: '/docs/api', external: true },
        { title: 'Documentation', icon: BookOpen, href: '/docs', external: true },
      ],
    }
  ],
  [UserRoles.RECYCLER]: [
    {
      label: 'Operations',
      items: [
        { title: 'EOL Products', icon: Recycle, href: 'eol' },
        { title: 'Circularity Credits', icon: LifeBuoy, href: 'credits' },
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
        { title: 'Analytics', icon: BarChart3, href: 'analytics' },
      ],
    },
  ],
  [UserRoles.SERVICE_PROVIDER]: [
    {
      label: 'Operations',
      items: [
        { title: 'Service Tickets', icon: Ticket, href: 'tickets' },
        { title: 'Browse Products', icon: BookCopy, href: 'products' },
        { title: 'Production Lines', icon: Factory, href: 'lines' },
      ],
    },
    {
      label: 'Analysis',
      items: [{ title: 'Analytics', icon: BarChart3, href: 'analytics' }],
    },
  ],
};
