// src/app/dashboard/flagged/page.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getProducts } from '@/lib/actions';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function FlaggedProductsPage() {
  const allProducts = await getProducts();
  const flaggedProducts = allProducts.filter(
    p => p.verificationStatus === 'Failed',
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flagged Products</CardTitle>
        <CardDescription>
          Review and manage products that have failed compliance verification.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Reason Flagged</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flaggedProducts.map(product => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">
                  {product.productName}
                  <p className="text-xs text-muted-foreground">
                    Supplier: {product.supplier}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="text-sm">
                    {product.sustainability?.complianceSummary ||
                      'No reason provided.'}
                  </p>
                </TableCell>
                <TableCell>
                  {product.lastVerificationDate &&
                    formatDistanceToNow(
                      new Date(product.lastVerificationDate),
                      {
                        addSuffix: true,
                      },
                    )}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm" className="mr-2">
                    <Link href={`/products/${product.id}`} target="_blank">
                      View Details
                    </Link>
                  </Button>
                  <Button variant="secondary" size="sm" disabled>
                    Resolve
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {flaggedProducts.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            <p>No products are currently flagged for non-compliance.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
