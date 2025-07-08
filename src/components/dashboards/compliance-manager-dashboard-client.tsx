// src/components/dashboards/compliance-manager-dashboard-client.tsx
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { User, Product } from '@/types';
import { AlertTriangle, ArrowRight, ShieldX } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface ComplianceManagerDashboardClientProps {
  user: User;
  flaggedProducts: Product[];
  commonGaps: { issue: string; count: number }[];
}

export default function ComplianceManagerDashboardClient({
  user,
  flaggedProducts,
  commonGaps,
}: ComplianceManagerDashboardClientProps) {
  const recentFlagged = flaggedProducts
    .sort(
      (a, b) =>
        new Date(b.lastVerificationDate!).getTime() -
        new Date(a.lastVerificationDate!).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Compliance Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome, {user.fullName}. Here is an overview of the current
          compliance status.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Flagged Products
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flaggedProducts.length}</div>
            <p className="text-xs text-muted-foreground">
              Products requiring immediate attention
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild size="sm" className="w-full">
              <Link href="/dashboard/compliance-manager/flagged">
                Go to Full Queue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recently Flagged Products</CardTitle>
            <CardDescription>
              These are the latest products that failed verification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentFlagged.length > 0 ? (
              <div className="space-y-4">
                {recentFlagged.map(product => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{product.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.sustainability?.complianceSummary ||
                          'Reason not specified.'}
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
                <p>No products are currently flagged. Great job!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldX className="h-5 w-5 text-muted-foreground" />
            Most Common Compliance Gaps
          </CardTitle>
          <CardDescription>
            The top compliance issues found across all flagged products.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {commonGaps.length > 0 ? (
            <div className="space-y-4">
              {commonGaps.map((gap, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-4"
                >
                  <p className="text-sm text-muted-foreground flex-1">
                    {gap.issue}
                  </p>
                  <Badge variant="destructive">{gap.count} products</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>No compliance gaps found in flagged products.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
