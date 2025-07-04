// src/app/dashboard/admin/analytics/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser, getUsers, getCompanies } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { getProducts, getAuditLogs } from '@/lib/actions';
import { UserRoles, type Role } from '@/lib/constants';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Activity,
  BookCopy,
  ShieldCheck,
  Users,
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
  Globe,
} from 'lucide-react';
import ComplianceOverviewChart from '@/components/charts/compliance-overview-chart';
import ProductsOverTimeChart from '@/components/charts/products-over-time-chart';
import ComplianceRateChart from '@/components/charts/compliance-rate-chart';
import { format, subDays, formatDistanceToNow } from 'date-fns';
import type { AuditLog, Product } from '@/types';
import EolStatusChart from '@/components/charts/eol-status-chart';
import CustomsStatusChart from '@/components/charts/customs-status-chart';

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
  'customs.inspected': Globe,
  default: Clock,
};

const getActionLabel = (action: string): string => {
  return action
    .split('.')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper to generate mock compliance rate data
const generateComplianceRateData = (products: Product[]) => {
  const data: { date: string; rate: number }[] = [];
  const sortedProducts = products.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  let verifiedCount = 0;
  sortedProducts.forEach((p, index) => {
    if (p.verificationStatus === 'Verified') {
      verifiedCount++;
    }
    const rate = Math.round((verifiedCount / (index + 1)) * 100);
    data.push({ date: format(new Date(p.createdAt), 'yyyy-MM-dd'), rate });
  });

  return data;
};

export default async function AnalyticsPage() {
  const user = await getCurrentUser(UserRoles.ADMIN);

  const allowedRoles: Role[] = [
    UserRoles.ADMIN,
    UserRoles.BUSINESS_ANALYST,
    UserRoles.RECYCLER,
    UserRoles.SERVICE_PROVIDER,
    UserRoles.RETAILER,
    UserRoles.AUDITOR,
  ];

  if (!allowedRoles.some(role => hasRole(user, role))) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  const [products, users, auditLogs, companies] = await Promise.all([
    getProducts(user.id),
    getUsers(),
    getAuditLogs(),
    getCompanies(),
  ]);

  const complianceData = {
    verified: products.filter(p => p.verificationStatus === 'Verified').length,
    pending: products.filter(p => p.verificationStatus === 'Pending').length,
    failed: products.filter(p => p.verificationStatus === 'Failed').length,
  };

  const eolData = {
    active: products.filter(
      p => p.endOfLifeStatus === 'Active' || !p.endOfLifeStatus,
    ).length,
    recycled: products.filter(p => p.endOfLifeStatus === 'Recycled').length,
    disposed: products.filter(p => p.endOfLifeStatus === 'Disposed').length,
  };

  const customsData = {
    cleared: products.filter(p => p.customs?.status === 'Cleared').length,
    detained: products.filter(p => p.customs?.status === 'Detained').length,
    rejected: products.filter(p => p.customs?.status === 'Rejected').length,
  };
  const totalInspections = customsData.cleared + customsData.detained + customsData.rejected;

  // Group products by creation date for the time-series chart
  const productsByDate = products.reduce(
    (acc, product) => {
      const date = format(new Date(product.createdAt), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date]++;
      return acc;
    },
    {} as Record<string, number>,
  );

  const productsOverTimeData = Object.entries(productsByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const complianceRateData = generateComplianceRateData(products);

  const recentActivity = auditLogs.slice(0, 5);
  const productMap = new Map(products.map(p => [p.id, p.productName]));
  const userMap = new Map(users.map(u => [u.id, u.fullName]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Analytics</h1>
        <p className="text-muted-foreground">
          An overview of platform activity and key metrics.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all suppliers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">All roles included</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Suppliers
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
            <p className="text-xs text-muted-foreground">Active tenants</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Inspections
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInspections}</div>
            <p className="text-xs text-muted-foreground">Customs events recorded</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Products Created Over Time</CardTitle>
            <CardDescription>
              A view of new passports being created on the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductsOverTimeChart data={productsOverTimeData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Compliance Rate Over Time</CardTitle>
            <CardDescription>
              The percentage of total products that are verified.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ComplianceRateChart data={complianceRateData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Compliance Overview</CardTitle>
            <CardDescription>
              A snapshot of the current verification status across all products.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ComplianceOverviewChart data={complianceData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>End-of-Life Status</CardTitle>
            <CardDescription>
              A breakdown of the lifecycle status of all products.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EolStatusChart data={eolData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Customs Status</CardTitle>
            <CardDescription>
              A breakdown of border inspection results.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomsStatusChart data={customsData} />
          </CardContent>
        </Card>
        <Card>
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
                const user = userMap.get(log.userId) || 'System';
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
                          by {user}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Product: {product}
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
      </div>
    </div>
  );
}
