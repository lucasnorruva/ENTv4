
// src/app/dashboard/audit/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
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
import { AuditReviewDialog } from '@/components/audit-review-dialog';
import { getProducts } from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function AuditQueuePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const [productsData, userData] = await Promise.all([
        getProducts(),
        getCurrentUser('Auditor'),
      ]);
      setProducts(productsData);
      setUser(userData);
      setIsLoading(false);
    }
    fetchData();
  }, []);

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
  };

  const productsToAudit = products.filter(
    (p) => p.verificationStatus === 'Pending',
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Audit Queue</CardTitle>
          <CardDescription>
            Review products pending verification. Approve or reject them based on compliance data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
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
          )}
          {!isLoading && productsToAudit.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <p>No products are currently in the audit queue.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {user && <AuditReviewDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        product={selectedProduct}
        user={user}
        onUpdate={handleUpdate}
      />}
    </>
  );
}
