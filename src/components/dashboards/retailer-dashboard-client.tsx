// src/components/dashboards/retailer-dashboard-client.tsx
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
import { ArrowRight, BarChart3, Search, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface RetailerDashboardClientProps {
  user: User;
  products: Product[];
}

export default function RetailerDashboardClient({
  user,
  products,
}: RetailerDashboardClientProps) {
  const stats = {
    totalProducts: products.length,
    verifiedProducts: products.filter(p => p.verificationStatus === 'Verified')
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-muted-foreground" />
                Product Lookup
              </CardTitle>
              <CardDescription>
                Browse and search the entire product catalog.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Click below to go to the full interactive catalog to search for
                products.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild size="sm" className="w-full">
                <Link href="/dashboard/retailer/catalog">
                  Browse Full Catalog <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                Market Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
                <p className="text-xs text-muted-foreground">
                  Total Products in Catalog
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.verifiedProducts}</p>
                <p className="text-xs text-muted-foreground">
                  Verified & Compliant
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href="/dashboard/retailer/analytics">
                  View Full Analytics <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recently Added Products</CardTitle>
              <CardDescription>
                The latest products available on the platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentlyAdded.length > 0 ? (
                <div className="space-y-4">
                  {recentlyAdded.map(product => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Image
                          src={product.productImage}
                          alt={product.productName}
                          width={40}
                          height={40}
                          className="rounded-md object-cover"
                          data-ai-hint="product photo"
                        />
                        <div>
                          <Link
                            href={`/dashboard/retailer/products/${product.id}`}
                            className="font-medium hover:underline"
                          >
                            {product.productName}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            From {product.supplier}
                          </p>
                        </div>
                      </div>
                      <Button asChild variant="secondary" size="sm">
                        <Link
                          href={`/dashboard/retailer/products/${product.id}`}
                        >
                          View Details
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <ShoppingBag className="mx-auto h-12 w-12" />
                  <p className="mt-4 font-semibold">
                    No products available yet
                  </p>
                  <p className="text-sm">
                    Check back later for new additions to the catalog.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
