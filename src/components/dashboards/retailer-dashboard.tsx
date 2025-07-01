// src/components/dashboards/retailer-dashboard.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import type { User } from '@/types';
import { getProducts } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookCopy, ShieldAlert, Search } from 'lucide-react';
import Link from 'next/link';
import { Input } from '../ui/input';

export default async function RetailerDashboard({ user }: { user: User }) {
  const products = await getProducts(user.id);
  const stats = {
    totalProducts: products.length,
    failedVerification: products.filter(p => p.verificationStatus === 'Failed')
      .length,
  };

  const recentlyAdded = products
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Retailer Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome, {user.fullName}. View product compliance and data for your
          inventory.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Lookup</CardTitle>
          <CardDescription>
            Quickly find a product passport by its name or ID.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input type="text" placeholder="Search by Product Name or ID..." />
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" /> Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Products in Catalog
            </CardTitle>
            <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Total products available on the platform
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/dashboard/retailer/catalog">
                Browse Full Catalog <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Compliance Issues
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.failedVerification}
            </div>
            <p className="text-xs text-muted-foreground">
              Products that failed verification
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
