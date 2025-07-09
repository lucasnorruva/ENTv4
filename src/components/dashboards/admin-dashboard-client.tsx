
// src/components/dashboards/admin-dashboard-client.tsx
'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
 CardTitle,
} from '@/components/ui/card';
import type { AuditLog, User } from '@/types';
import { Button } from '../ui/button';
import {
  Users,
  ArrowRight,
  BookCopy,
  ShieldCheck,
  Clock,
  Edit,
  FilePlus,
  FileUp,
  Trash2,
  CheckCircle,
  FileX,
  Calculator,
  Recycle,
  ShieldX,
  Building2,
  Hourglass,
  Cog,
  Wrench,
  Ticket,
  Globe,
  Scale,
  Webhook as WebhookIcon,
  KeyRound,
  History,
  Award,
  UserPlus,
} from 'lucide-react';
import { hasRole } from '@/lib/auth-utils';
import { UserRoles } from '@/lib/constants';
import ComplianceOverviewChart from '../charts/compliance-overview-chart';
import RelativeTime from '../relative-time';

interface AdminDashboardClientProps {
  user: User;
  stats: {
    totalCompanies: number;
    totalUsers: number;
    totalProducts: number;
    verifiedPassports: number;
    pendingReviews: number;
    failedVerifications: number;
    openServiceTickets: number;
    totalCreditsIssued: number;
  };
  complianceChartData: {
    verified: number;
    pending: number;
    failed: number;
  };
  recentActivity: AuditLog[];
  entityMaps: {
    users: Map<string, string>;
    products: Map<string, string>;
    companies: Map<string, string>;
    webhooks: Map<string, string>;
  };
}

const actionIcons: Record<string, React.ElementType> = {
  'product.created': FilePlus,
  'product.updated': Edit,
  'product.deleted': Trash2,
  'product.recycled': Recycle,
  'product.recalculate_score': Calculator,
  'passport.submitted': FileUp,
  'passport.approved': CheckCircle,
  'passport.rejected': FileX,
  'compliance.resolved': ShieldX,
  'product.serviced': Wrench,
  'user.created': UserPlus,
  'user.updated': Edit, // Keep Edit for user.updated
  'user.deleted': Trash2,
  'company.created': Building2,
  'webhook.created': WebhookIcon,
  'webhook.delivery.success': CheckCircle,
  'webhook.delivery.failure': ShieldX,
  'ticket.created': Ticket,
  'api_key.created': KeyRound,
  'system.sync.reference_data': Cog,
  'cron.start': Clock,
  'cron.end': History,
  'credits.minted': Award,
  default: Clock,
};

const getActionLabel = (action: string): string => {
  return action
    .split('.')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface EntityMaps {
    users: Map<string, string>;
    products: Map<string, string>;
    companies: Map<string, string>;
    webhooks: Map<string, string>;
}

const getLogDescription = (log: AuditLog, maps: EntityMaps): string => {
  const { action, entityId, details } = log;

  if (
    action.startsWith('product.') ||
    action.startsWith('passport.') ||
    action.startsWith('credits.')
  ) {
    return `Product: ${maps.products.get(entityId) || entityId}`;
  }
  if (action.startsWith('user.')) {
    return `User: ${maps.users.get(entityId) || entityId}`;
  }
  if (action.startsWith('company.')) {
    return `Company: ${maps.companies.get(entityId) || entityId}`;
  }
  if (action.startsWith('webhook.delivery')) {
    return `Webhook: ${maps.webhooks.get(entityId) || entityId}`;
  }
  if (action.startsWith('webhook.')) {
    return `URL: ${details.url || entityId}`;
  }
  if (action.startsWith('ticket.')) {
    const productName = details.productId
      ? maps.products.get(details.productId)
      : 'N/A';
    return `For Product: ${productName}`;
  }
  if (action.startsWith('api_key.')) {
    return `Label: ${details.label || entityId}`;
  }

  return `Entity ID: ${entityId}`;
};

export default function AdminDashboardClient({
  user,
  stats,
  complianceChartData,
  recentActivity,
  entityMaps,
}: AdminDashboardClientProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome, {user.fullName}. Here is a high-level overview of the entire
          Norruva platform.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Companies
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">Active tenants</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Across all companies
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Currently in the system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Verified Passports
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verifiedPassports}</div>
            <p className="text-xs text-muted-foreground">
              Successfully anchored
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReviews}</div>
            <p className="text-xs text-muted-foreground">In the audit queue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Failed Verifications
            </CardTitle>
            <ShieldX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.failedVerifications}
            </div>
            <p className="text-xs text-muted-foreground">
              Require compliance action
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Open Service Tickets
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.openServiceTickets}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Circularity Credits
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCreditsIssued}
            </div>
            <p className="text-xs text-muted-foreground">Total issued</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Platform Activity</CardTitle>
            <CardDescription>
              A stream of the latest actions across the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map(log => {
                const Icon = actionIcons[log.action] || actionIcons.default;
                const logUser = entityMaps.users.get(log.userId) || 'System';
                const actionLabel = getActionLabel(log.action);
                const description = getLogDescription(log, entityMaps);
                return (
                  <div key={log.id} className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-full">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {actionLabel}{' '}
                        <span className="font-normal text-muted-foreground">
                          by {logUser}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-sm">
                        {description}
                      </p>
                    </div>
                    <RelativeTime
                      date={log.createdAt}
                      className="text-xs text-muted-foreground shrink-0"
                    />
                  </div>
                );
              })}
              {recentActivity.length === 0 && (
                <p className="text-sm text-center text-muted-foreground py-4">
                  No recent activity.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Verification Status</CardTitle>
              <CardDescription>
                A breakdown of all products by verification status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ComplianceOverviewChart data={complianceChartData} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Jump to key administrative sections.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/admin/users">
                  Manage Users
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/admin/companies">
                  Manage Companies
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/admin/compliance">
                  Manage Compliance
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/admin/api-settings">
                  Configure API Settings
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/admin/service-tickets">
                  Manage Service Tickets
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/admin/tickets">
                  Manage Support Tickets
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
              {(hasRole(user, UserRoles.ADMIN) ||
                hasRole(user, UserRoles.MANUFACTURER) ||
                hasRole(user, UserRoles.RETAILER)) && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/admin/global-tracker">
                    Global Tracker
                    <Globe className="ml-auto h-4 w-4" />
                  </Link>
                </Button>
              )}
              {(hasRole(user, UserRoles.ADMIN) ||
                hasRole(user, UserRoles.AUDITOR) ||
                hasRole(user, UserRoles.COMPLIANCE_MANAGER)) && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/admin/customs">
                    Customs Dashboard
                    <Scale className="ml-auto h-4 w-4" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
