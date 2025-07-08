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
  Building2,
  Fingerprint,
  RefreshCw,
  TestTubeDiagonal,
  Ticket,
  Lock,
  Award,
  Beaker,
  LifeBuoy,
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
  {
    href: `/dashboard/developer/explorer`,
    icon: TestTubeDiagonal,
    text: 'API Explorer',
  },
  { href: `/dashboard/developer/webhooks`, icon: Webhook, text: 'Webhooks' },
  { href: `/dashboard/developer/analytics`, icon: BarChart3, text: 'Analytics' },
  { href: `/dashboard/developer/test-generator`, icon: Beaker, text: 'Test Generator' },
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
    href: `/dashboard/developer/integrations`,
    icon: Wrench,
    text: 'Integrations',
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
        { title: 'All Products', icon: BookCopy, href: 'products' },
        { title: 'Users', icon: Users, href: 'users' },
        { title: 'Companies', icon: Building2, href: 'companies' },
        {
          title: 'Compliance Paths',
          icon: FileQuestion,
          href: 'compliance',
        },
        { title: 'Trust Hub', icon: Fingerprint, href: 'blockchain' },
        { title: 'Regulation Sync', icon: RefreshCw, href: 'reg-sync' },
        { title: 'Platform Logs', icon: Clock, href: 'logs' },
      ],
    },
    {
      label: 'Operations',
      items: [
          { title: 'Service Tickets', icon: Wrench, href: 'service-tickets'},
          { title: 'Support Tickets', icon: Ticket, href: 'tickets' },
      ],
    },
    {
      label: 'System Configuration',
      items: [
        { title: 'Permissions', icon: Lock, href: 'permissions' },
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
          title: 'Customs Dashboard',
          icon: Scale,
          href: 'customs',
        },
         { title: 'Analytics', icon: BarChart3, href: 'analytics' },
      ],
    },
  ],
  [UserRoles.SUPPLIER]: [
    {
      label: 'Passport Management',
      items: [
        {
          title: 'My Products',
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
          icon: FileQuestion,
          href: 'data-quality',
        }
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
      label: 'Operations',
      items: [
        { title: 'All Products', icon: BookCopy, href: 'products' },
        { title: 'Production Lines', icon: Factory, href: 'lines' },
        { title: 'Service Tickets', icon: Wrench, href: 'tickets' },
      ],
    },
    {
      label: 'Analysis',
      items: [
        { title: 'Analytics', icon: BarChart3, href: 'analytics' },
        {
          title: 'Material Composition',
          icon: Recycle,
          href: 'composition',
        },
        { title: 'Global Tracker', icon: Globe, href: 'global-tracker' },
        { title: 'Customs Dashboard', icon: Scale, href: 'customs' },
      ],
    },
  ],
  [UserRoles.AUDITOR]: [
    {
      label: 'Auditing',
      items: [
        { title: 'Audit Queue', icon: ShieldCheck, href: 'audit' },
        { title: 'All Products', icon: BookCopy, href: 'products' },
        { title: 'Analytics', icon: BarChart3, href: 'analytics' },
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
        {
          title: 'Customs Dashboard',
          icon: Scale,
          href: 'customs',
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
  [UserRoles.DEVELOPER]: [
    {
      label: 'Development',
      items: [
        { title: 'API Keys', icon: KeyRound, href: 'keys' },
        { title: 'Webhooks', icon: Webhook, href: 'webhooks' },
        { title: 'API Explorer', icon: TestTubeDiagonal, href: 'explorer' },
        { title: 'Test Generator', icon: Beaker, href: 'test-generator' },
        { title: 'Integrations', icon: Wrench, href: 'integrations' },
      ],
    },
    {
      label: 'Monitoring',
      items: [
        { title: 'API Logs', icon: FileText, href: 'logs' },
        { title: 'API Analytics', icon: BarChart3, href: 'analytics' },
      ],
    },
    {
      label: 'Resources',
      items: [
        {
          title: 'Documentation',
          icon: BookOpen,
          href: '/docs',
          external: true,
        },
      ],
    },
  ],
  [UserRoles.RETAILER]: [
    {
      label: 'Procurement',
      items: [
        { title: 'Product Catalog', icon: BookCopy, href: 'catalog' },
        { title: 'Global Tracker', icon: Globe, href: 'global-tracker' },
        { title: 'Customs Dashboard', icon: Scale, href: 'customs' },
      ],
    },
    {
      label: 'Analysis',
      items: [{ title: 'Supplier Analytics', icon: BarChart3, href: 'analytics' }],
    },
  ],
  [UserRoles.BUSINESS_ANALYST]: [
    {
      label: 'Reporting',
      items: [
        { title: 'Analytics', icon: BarChart3, href: 'analytics' },
        {
          title: 'Sustainability',
          icon: ShieldCheck,
          href: 'sustainability',
        },
        {
          title: 'Material Composition',
          icon: Recycle,
          href: 'composition',
        },
        { title: 'Data Export', icon: FileText, href: 'export' },
      ],
    },
  ],
  [UserRoles.RECYCLER]: [
    {
      label: 'Operations',
      items: [
        { title: 'EOL Products', icon: Recycle, href: 'eol' },
        {
          title: 'Material Composition',
          icon: Recycle,
          href: 'composition',
        },
      ],
    },
    {
      label: 'Rewards',
      items: [{ title: 'Credit History', icon: Award, href: 'credits' }],
    },
  ],
  [UserRoles.SERVICE_PROVIDER]: [
    {
      label: 'Operations',
      items: [
        { title: 'Service Tickets', icon: Wrench, href: 'tickets' },
        { title: 'Product Catalog', icon: BookCopy, href: 'products' },
        { title: 'Production Lines', icon: Factory, href: 'lines' },
      ],
    },
    {
      label: 'Analysis',
      items: [
        { title: 'Service Analytics', icon: BarChart3, href: 'analytics' },
      ],
    },
  ],
};
