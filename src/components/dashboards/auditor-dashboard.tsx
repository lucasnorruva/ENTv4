
// src/components/dashboards/auditor-dashboard.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import type { User } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Hourglass } from 'lucide-react';
import Link from 'next/link';
import { getProducts } from '@/lib/actions';
import { formatDistanceToNow } from 'date-fns';

export default async function AuditorDashboard({ user }: { user: User }) {
  const products = await getProducts(user.id);
  const stats = {
    pending: products.filter(p => p.verificationStatus === 'Pending').length,
    verified: products.filter(p => p.verificationStatus === 'Verified').length,
  };

  const recentPending = products
    .filter(p => p.verificationStatus === 'Pending')
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Auditor Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.fullName}. Here is an overview of the current
          audit queue.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
          <CardFooter>
            <Button asChild size="sm" className="w-full">
              <Link href="/dashboard/audit">
                Go to Full Audit Queue <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recently Submitted for Review</CardTitle>
          <CardDescription>
            The latest products added to the audit queue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentPending.length > 0 ? (
            <div className="space-y-4">
              {recentPending.map(product => (
                <div
                  key={product.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{product.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      From {product.supplier}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-xs text-muted-foreground"
                      suppressHydrationWarning
                    >
                      {formatDistanceToNow(new Date(product.updatedAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>The audit queue is clear. Great job!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
