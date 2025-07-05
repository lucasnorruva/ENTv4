// src/components/dashboards/recycler-dashboard.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';
import { ArrowRight, CheckCircle, Recycle, Award } from 'lucide-react';
import Link from 'next/link';
import { getProducts } from '@/lib/actions';

export default async function RecyclerDashboard({ user }: { user: User }) {
  const products = await getProducts(user.id);
  const stats = {
    recycled: products.filter(p => p.endOfLifeStatus === 'Recycled').length,
    active: products.filter(
      p => p.endOfLifeStatus === 'Active' || !p.endOfLifeStatus,
    ).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Recycler Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome, {user.fullName}. Here is an overview of product EOL statuses.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Circularity Credits
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user.circularityCredits ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Credits earned for recycling products
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild size="sm" className="w-full">
              <Link href="/dashboard/recycler/credits">
                View Credit History <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Products Recycled
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recycled}</div>
            <p className="text-xs text-muted-foreground">
              Total products processed by you
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Products in Circulation
            </CardTitle>
            <Recycle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Available for recycling
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage End-of-Life Products</CardTitle>
          <CardDescription>
            Access the queue of products to mark their end-of-life status,
            contributing to the circular economy.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild>
            <Link href="/dashboard/recycler/eol">
              Go to EOL Scanner <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
