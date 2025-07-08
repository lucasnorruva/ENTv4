// src/components/dashboards/auditor-dashboard-client.tsx
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { User, Product } from '@/types';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  CheckCircle,
  Hourglass,
  BarChart3,
  List,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface AuditorDashboardClientProps {
  user: User;
  products: Product[];
}

export default function AuditorDashboardClient({
  user,
  products,
}: AuditorDashboardClientProps) {
  const stats = {
    pending: products.filter(p => p.verificationStatus === 'Pending').length,
    verified: products.filter(p => p.verificationStatus === 'Verified').length,
    total: products.length,
  };

  const recentlyAudited = products
    .filter(
      p =>
        p.verificationStatus === 'Verified' ||
        p.verificationStatus === 'Failed',
    )
    .sort(
      (a, b) =>
        new Date(b.lastVerificationDate!).getTime() -
        new Date(a.lastVerificationDate!).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Auditor Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.fullName}. Here is an overview of the current
          audit queue and platform status.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Products awaiting verification
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Verified
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verified}</div>
            <p className="text-xs text-muted-foreground">
              Passports approved by auditors
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Passports
            </CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Across the entire platform
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Full Analytics
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Dive deeper into platform trends and audit metrics.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild size="sm" className="w-full">
              <Link href="/dashboard/auditor/analytics">
                View Analytics <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recently Audited Products</CardTitle>
          <CardDescription>
            The latest products you and other auditors have reviewed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentlyAudited.length > 0 ? (
            <div className="space-y-4">
              {recentlyAudited.map(product => (
                <div
                  key={product.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{product.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      From {product.supplier} - Status:{' '}
                      <span
                        className={
                          product.verificationStatus === 'Verified'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }
                      >
                        {product.verificationStatus}
                      </span>
                    </p>
                  </div>
                  <div
                    className="text-right text-xs text-muted-foreground"
                    suppressHydrationWarning
                  >
                    {product.lastVerificationDate &&
                      formatDistanceToNow(
                        new Date(product.lastVerificationDate),
                        { addSuffix: true },
                      )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>No products have been audited yet.</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full" variant="secondary">
            <Link href="/dashboard/auditor/audit">
              Go to Full Audit Queue <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
