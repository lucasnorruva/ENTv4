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

export default async function AuditorDashboard({ user }: { user: User }) {
  const products = await getProducts();
  const stats = {
    pending: products.filter(p => p.verificationStatus === 'Pending').length,
    verified: products.filter(p => p.verificationStatus === 'Verified').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Auditor Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.fullName}. Here is an overview of the current audit queue.
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
          <CardTitle>Go to Audit Queue</CardTitle>
          <CardDescription>
            Access the full queue of products waiting for your review. Approve or reject passports to ensure compliance.
          </CardDescription>
        </CardHeader>
        <CardFooter>
           <Button asChild>
            <Link href="/dashboard/audit">
              Review Products <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
