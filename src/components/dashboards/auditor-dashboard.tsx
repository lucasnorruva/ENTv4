'use client';

import React, { useState } from 'react';
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
import type { Product, User } from '@/types';
import { AuditReviewDialog } from '../audit-review-dialog';

export default function AuditorDashboard({
  products: initialProducts,
  user,
}: {
  products: Product[];
  user: User;
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleReviewClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleUpdate = (updatedProduct: Product) => {
    setProducts((currentProducts) =>
      currentProducts.map((p) =>
        p.id === updatedProduct.id ? updatedProduct : p,
      ),
    );
    // The dialog will handle closing itself.
  };

  const productsToAudit = products.filter(
    (p) => p.verificationStatus === 'Pending',
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Auditor Dashboard</CardTitle>
          <CardDescription>
            Review products for compliance, run checks, and view audit history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsToAudit.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    {product.productName}
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {product.verificationStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReviewClick(product)}
                    >
                      Review Product
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {productsToAudit.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <p>No products are currently in the audit queue.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AuditReviewDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        product={selectedProduct}
        user={user}
        onUpdate={handleUpdate}
      />
    </>
  );
}
