// src/components/dashboards/supplier-dashboard.tsx
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
  Hourglass,
  AlertTriangle,
} from 'lucide-react';
import { getProducts } from '@/lib/actions';

export default async function SupplierDashboard({ user }: { user: User }) {
  const products = await getProducts(user.id);
  const stats = {
    total: products.length,
    pending: products.filter(p => p.verificationStatus === 'Pending').length,
    verified: products.filter(p => p.verificationStatus === 'Verified').length,
    failed: products.filter(p => p.verificationStatus === 'Failed').length,
    drafts: products.filter(p => p.status === 'Draft').length,
  };

  const productsNeedingAttention = products
    .filter(p => p.status === 'Draft' || p.verificationStatus === 'Failed')
    .slice(0, 5);

  const getAttentionVariant = (
    product: Product,
  ): 'destructive' | 'secondary' => {
    return product.verificationStatus === 'Failed' ? 'destructive' : 'secondary';
  };
  const getAttentionText = (product: Product): string => {
    if (product.verificationStatus === 'Failed') return 'Failed Verification';
    return product.status; // Draft
  };

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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
              Pending Review
            </CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Products awaiting auditor verification
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
              Products that are fully compliant
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Action</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.failed + stats.drafts}
            </div>
            <p className="text-xs text-muted-foreground">
              Drafts & Failed Verifications
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Products Requiring Attention</CardTitle>
            <CardDescription>
              Review drafts that need to be submitted or fix issues with failed
              verifications.
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
                      <Link href="/dashboard/supplier/products">
                        View <ArrowRight className="ml-2 h-4 w-4" />
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

        <Card>
          <CardHeader>
            <CardTitle>Manage Your Passports</CardTitle>
            <CardDescription>
              Create, edit, and track the verification status of all your
              product passports.
            </CardDescription>
          </CardHeader>
          <CardFooter className="gap-4">
            <Button asChild>
              <Link href="/dashboard/supplier/products">
                Manage Products <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/supplier/history">
                View Activity History <Clock className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
