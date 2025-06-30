// src/components/dashboards/recycler-dashboard.tsx
'use client';

import React, { useState, useTransition } from 'react';
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
import { markAsRecycled } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function RecyclerDashboard({
  products: initialProducts,
  user,
}: {
  products: Product[];
  user: User;
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleMarkAsRecycled = (productId: string) => {
    setProcessingId(productId);
    startTransition(async () => {
      try {
        const updatedProduct = await markAsRecycled(productId, user.id);
        setProducts(currentProducts =>
          currentProducts.map(p =>
            p.id === updatedProduct.id ? updatedProduct : p,
          ),
        );
        toast({
          title: 'Success',
          description: `Product "${updatedProduct.productName}" marked as recycled.`,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to mark product as recycled.',
          variant: 'destructive',
        });
      } finally {
        setProcessingId(null);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recycler Dashboard</CardTitle>
        <CardDescription>
          Track end-of-life products and confirm recycling compliance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Current EOL Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map(product => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">
                  {product.productName}
                </TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      product.endOfLifeStatus === 'Recycled'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {product.endOfLifeStatus ?? 'Active'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAsRecycled(product.id)}
                    disabled={
                      isPending || product.endOfLifeStatus !== 'Active'
                    }
                  >
                    {isPending && processingId === product.id && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Mark as Recycled
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
