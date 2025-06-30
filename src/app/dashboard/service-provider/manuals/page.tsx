// src/app/dashboard/service-provider/manuals/page.tsx
import { redirect } from 'next/navigation';
import { getProducts } from '@/lib/actions';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Download } from 'lucide-react';
import Image from 'next/image';

export default async function ManualsPage() {
  const user = await getCurrentUser(UserRoles.SERVICE_PROVIDER);

  if (!hasRole(user, UserRoles.SERVICE_PROVIDER)) {
    redirect(`/dashboard/service-provider`);
  }

  const products = await getProducts(user.id);
  const productsWithManuals = products.filter(p => p.manualUrl);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Manuals</CardTitle>
        <CardDescription>
          Find and download technical manuals for product servicing and repair.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productsWithManuals.map(product => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Image
                      src={product.productImage}
                      alt={product.productName}
                      width={40}
                      height={40}
                      className="rounded-md object-cover"
                      data-ai-hint="product photo"
                    />
                    <span className="font-medium">{product.productName}</span>
                  </div>
                </TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{product.supplier}</TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link href={product.manualUrl!} target="_blank">
                      <Download className="mr-2 h-4 w-4" />
                      Download Manual
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {productsWithManuals.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No product manuals available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}