// src/components/supplier-compliance-report.tsx
'use client';

import type { Product } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface SupplierComplianceReportProps {
  initialProducts: Product[];
}

const getVerificationVariant = (status?: Product["verificationStatus"]) => {
    switch (status) {
      case "Verified":
        return "default";
      case "Pending":
        return "secondary";
      case "Failed":
        return "destructive";
      default:
        return "outline";
    }
};

const ProductListTable = ({ products }: { products: Product[] }) => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Action</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {products.length > 0 ? (
                products.map((product) => (
                    <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.productName}</TableCell>
                        <TableCell>
                            <Badge variant={getVerificationVariant(product.verificationStatus)}>
                                {product.verificationStatus ?? 'Not Submitted'}
                            </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(product.updatedAt), 'PPP')}</TableCell>
                        <TableCell className="text-right">
                           <Button asChild variant="outline" size="sm">
                               <Link href={`/dashboard/supplier/products/${product.id}`}>View</Link>
                           </Button>
                        </TableCell>
                    </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        No products in this category.
                    </TableCell>
                </TableRow>
            )}
        </TableBody>
    </Table>
);


export default function SupplierComplianceReport({ initialProducts }: SupplierComplianceReportProps) {
  const verifiedProducts = initialProducts.filter(p => p.verificationStatus === 'Verified');
  const pendingProducts = initialProducts.filter(p => p.verificationStatus === 'Pending');
  const failedProducts = initialProducts.filter(p => p.verificationStatus === 'Failed');
  const drafts = initialProducts.filter(p => p.verificationStatus === 'Not Submitted' || !p.verificationStatus);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Report</CardTitle>
        <CardDescription>
          An overview of the verification status for all your products.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({initialProducts.length})</TabsTrigger>
            <TabsTrigger value="verified">Verified ({verifiedProducts.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingProducts.length})</TabsTrigger>
            <TabsTrigger value="failed">Failed ({failedProducts.length})</TabsTrigger>
            <TabsTrigger value="drafts">Drafts ({drafts.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
              <ProductListTable products={initialProducts} />
          </TabsContent>
          <TabsContent value="verified" className="mt-4">
              <ProductListTable products={verifiedProducts} />
          </TabsContent>
          <TabsContent value="pending" className="mt-4">
              <ProductListTable products={pendingProducts} />
          </TabsContent>
          <TabsContent value="failed" className="mt-4">
              <ProductListTable products={failedProducts} />
          </TabsContent>
          <TabsContent value="drafts" className="mt-4">
              <ProductListTable products={drafts} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
