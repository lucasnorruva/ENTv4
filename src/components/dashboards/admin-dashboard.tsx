// src/components/dashboards/admin-dashboard.tsx
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { User } from '@/types';
import {
  getCompliancePaths,
  getProducts,
  getAuditLogs,
  getCompanies,
} from '@/lib/actions';
import { getUsers } from '@/lib/auth';
import { Button } from '../ui/button';
import {
  FileQuestion,
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
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ComplianceOverviewChart from '../charts/compliance-overview-chart';

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
  default: Clock,
};

const getActionLabel = (action: string): string => {
  return action
    .split('.')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default async function AdminDashboard({ user }: { user: User }) {
  const [allUsers, allCompliancePaths, allProducts, auditLogs, allCompanies] =
    await Promise.all([
      getUsers(),
      getCompliancePaths(),
      getProducts(),
      getAuditLogs(),
      getCompanies(),
    ]);

  const stats = {
    totalCompanies: allCompanies.length,
    totalCompliancePaths: allCompliancePaths.length,
    totalProducts: allProducts.length,
    verifiedPassports: allProducts.filter(
      p => p.verificationStatus === 'Verified',
    ).length,
    pendingReviews: allProducts.filter(p => p.verificationStatus === 'Pending')
      .length,
    failedVerifications: allProducts.filter(
      p => p.verificationStatus === 'Failed',
    ).length,
  };

  const complianceChartData = {
    verified: stats.verifiedPassports,
    pending: stats.pendingReviews,
    failed: stats.failedVerifications,
  };

  const recentActivity = auditLogs.slice(0, 5);
  const userMap = new Map(allUsers.map(u => [u.id, u.fullName]));
  const productMap = new Map(allProducts.map(p => [p.id, p.productName]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome, {user.fullName}. Here is a high-level overview of the entire
          Norruva platform.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
              Compliance Paths
            </CardTitle>
            <FileQuestion className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCompliancePaths}
            </div>
            <p className="text-xs text-muted-foreground">Active rule sets</p>
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
                const logUser = userMap.get(log.userId) || 'System';
                const product = productMap.get(log.entityId) || log.entityId;
                const actionLabel = getActionLabel(log.action);
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
                      <p className="text-xs text-muted-foreground">
                        {log.action.includes('product') ||
                        log.action.includes('passport')
                          ? `Product: ${product}`
                          : `Entity: ${product}`}
                      </p>
                    </div>
                    <p
                      className="text-xs text-muted-foreground shrink-0"
                      suppressHydrationWarning
                    >
                      {formatDistanceToNow(new Date(log.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
