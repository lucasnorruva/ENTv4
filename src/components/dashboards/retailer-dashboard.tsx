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
import Image from 'next/image';
import RetailerSearchForm from '../retailer-search-form';

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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Product Lookup</CardTitle>
            <CardDescription>
              Quickly find a product passport by its name or ID.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RetailerSearchForm />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
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
                      <Link href={`/dashboard/retailer/products/${product.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>No products have been added yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
