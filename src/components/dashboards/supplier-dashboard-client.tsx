// src/components/dashboards/supplier-dashboard-client.tsx
'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { User, Product } from '@/types';
import {
  ArrowRight,
  BookCopy,
  CheckCircle,
  Clock,
  AlertTriangle,
  ListChecks,
} from 'lucide-react';
import ComplianceOverviewChart from '../charts/compliance-overview-chart';

interface SupplierDashboardClientProps {
  user: User;
  stats: {
    total: number;
    verified: number;
    failed: number;
    needsAction: number;
  };
  complianceData: {
    verified: number;
    pending: number;
    failed: number;
  };
  productsNeedingAttention: Product[];
}

export default function SupplierDashboardClient({
  user,
  stats,
  complianceData,
  productsNeedingAttention,
}: SupplierDashboardClientProps) {
  const getAttentionVariant = (
    product: Product,
  ): 'destructive' | 'secondary' | 'outline' => {
    if (product.verificationStatus === 'Failed') return 'destructive';
    if (product.dataQualityWarnings && product.dataQualityWarnings.length > 0)
      return 'secondary';
    return 'outline';
  };

  const getAttentionText = (product: Product): string => {
    if (product.verificationStatus === 'Failed') return 'Failed Verification';
    if (product.dataQualityWarnings && product.dataQualityWarnings.length > 0)
      return 'Quality Issue';
    return product.status; // Draft
  };

  const roleSlug = user.roles[0].toLowerCase().replace(/ /g, '-');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Supplier Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back, {user.fullName}. Here's an overview of your product
          passports.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
            <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Passports you are managing
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Verified Passports
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verified}</div>
            <p className="text-xs text-muted-foreground">
              Fully compliant products
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Action</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.needsAction}</div>
            <p className="text-xs text-muted-foreground">
              Drafts & Failed Verifications
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Compliance Overview</CardTitle>
            <CardDescription>
              A breakdown of your products by verification status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ComplianceOverviewChart data={complianceData} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Products Requiring Attention</CardTitle>
            <CardDescription>
              Drafts, failures, or data quality issues.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {productsNeedingAttention.length > 0 ? (
              <div className="space-y-4">
                {productsNeedingAttention.map(product => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{product.productName}</p>
                      <Badge variant={getAttentionVariant(product)}>
                        {getAttentionText(product)}
                      </Badge>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/${roleSlug}/products/${product.id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>No products need your attention right now. Well done!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks /> Data Quality
            </CardTitle>
            <CardDescription>
              Review AI-detected issues in your product data.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/dashboard/supplier/data-quality">
                Go to Report <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock /> Activity History
            </CardTitle>
            <CardDescription>
              View a log of all actions you have taken on the platform.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/dashboard/supplier/history">
                View History <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
