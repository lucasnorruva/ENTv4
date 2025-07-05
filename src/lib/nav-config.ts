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
  Award,
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
      label: 'System Configuration',
      items: [
        { title: 'API Settings', icon: Cog, href: 'api-settings' },
        {
          title: 'Integrations',
          icon: Wrench,
          href: 'integrations',
        },
        { title: 'Customs Info', icon: FileText, href: 'customs' },
      ],
    },
    {
      label: 'Visualizations',
      items: [
        { title: 'Global Tracker', icon: Globe, href: 'global-tracker' },
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
        { title: 'Service Tickets', icon: Ticket, href: 'tickets'},
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
        { title: 'Customs Info', icon: Globe, href: 'customs' },
        { title: 'Analytics', icon: BarChart3, href: 'analytics' },
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
  [UserRoles.RETAILER]: [
    {
      label: 'Retail Operations',
      items: [
        { title: 'Product Catalog', icon: ShoppingBag, href: 'catalog' },
        { title: 'Supplier Analytics', icon: BarChart3, href: 'analytics' },
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
      label: 'Configuration',
      items: [
        { title: 'API Keys', icon: KeyRound, href: 'keys' },
        { title: 'Webhooks', icon: Webhook, href: 'webhooks' },
        { title: 'API Settings', icon: Cog, href: 'api-settings' },
        { title: 'Integrations', icon: Wrench, href: 'integrations' },
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
          external: false,
        },
      ],
    },
  ],
  [UserRoles.RECYCLER]: [
    {
      label: 'Operations',
      items: [
        { title: 'EOL Products', icon: Recycle, href: 'eol' },
        { title: 'Credit History', icon: Award, href: 'credits' },
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
        { title: 'Production Lines', icon: Factory, href: 'lines' },
        { title: 'Browse Products', icon: BookCopy, href: 'products' },
      ],
    },
    {
      label: 'Analysis',
      items: [{ title: 'Analytics', icon: BarChart3, href: 'analytics' }],
    },
  ],
};
