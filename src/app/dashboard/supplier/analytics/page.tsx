// src/app/dashboard/supplier/analytics/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BookCopy, CheckCircle, ShieldAlert, TrendingUp } from 'lucide-react';
import { UserRoles } from '@/lib/constants';
import ComplianceOverviewChart from '@/components/charts/compliance-overview-chart';
import SustainabilityTable from '@/components/sustainability-table';

export default async function SupplierAnalyticsPage() {
  const user = await getCurrentUser(UserRoles.SUPPLIER);

  if (!hasRole(user, UserRoles.SUPPLIER)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  const products = await getProducts(user.id);
  const scoredProducts = products.filter(
    p => p.sustainability?.score !== undefined,
  );

  const stats = {
    totalProducts: products.length,
    verifiedProducts: products.filter(p => p.verificationStatus === 'Verified')
      .length,
    failedProducts: products.filter(p => p.verificationStatus === 'Failed')
      .length,
    averageEsg:
      scoredProducts.length > 0
        ? Math.round(
            scoredProducts.reduce(
              (sum, p) => sum + (p.sustainability?.score ?? 0),
              0,
            ) / scoredProducts.length,
          )
        : 0,
  };

  const complianceData = {
    verified: stats.verifiedProducts,
    pending: products.filter(p => p.verificationStatus === 'Pending').length,
    failed: stats.failedProducts,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Product Analytics</h1>
        <p className="text-muted-foreground">
          An overview of your products' compliance and sustainability
          performance.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
              Passports you are managing
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Verified Products
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verifiedProducts}</div>
            <p className="text-xs text-muted-foreground">
              Fully compliant products
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Failed Verifications
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedProducts}</div>
            <p className="text-xs text-muted-foreground">
              Require your attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average ESG Score
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageEsg} / 100</div>
            <p className="text-xs text-muted-foreground">
              Across all your scored products
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Compliance Breakdown</CardTitle>
            <CardDescription>
              A visual summary of your products' verification statuses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ComplianceOverviewChart data={complianceData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product ESG Scores</CardTitle>
            <CardDescription>
              A detailed list of your products and their sustainability scores.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SustainabilityTable products={scoredProducts} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
