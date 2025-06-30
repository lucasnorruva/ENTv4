// src/components/dashboards/admin-dashboard.tsx
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { User, AuditLog } from '@/types';
import {
  getCompliancePaths,
  getUsers,
  getProducts,
  getAuditLogs,
} from '@/lib/actions';
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
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
  const [allUsers, allCompliancePaths, allProducts, auditLogs] =
    await Promise.all([
      getUsers(),
      getCompliancePaths(),
      getProducts(),
      getAuditLogs(),
    ]);

  const stats = {
    totalUsers: allUsers.length,
    totalCompliancePaths: allCompliancePaths.length,
    totalProducts: allProducts.length,
    verifiedPassports: allProducts.filter(
      p => p.verificationStatus === 'Verified',
    ).length,
  };

  const recentActivity = auditLogs.slice(0, 5);
  const userMap = new Map(allUsers.map(u => [u.id, u.fullName]));
  const productMap = new Map(
    allProducts.map(p => [p.id, p.productName]),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome, {user.fullName}. Here is a high-level overview of the entire
          Norruva platform.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
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
            <div className="text-2xl font-bold">
              {stats.verifiedPassports}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully anchored
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
            <p className="text-xs text-muted-foreground">
              Active rule sets
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
                    <p className="text-xs text-muted-foreground shrink-0">
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

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Jump to key administrative sections.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button asChild variant="outline">
              <Link href="/dashboard/users">
                Manage Users
                <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/compliance">
                Manage Compliance Paths
                <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/analytics">
                View Full Analytics
                <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
