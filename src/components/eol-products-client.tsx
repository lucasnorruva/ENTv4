// src/components/eol-products-client.tsx
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

interface EolProductsClientProps {
  initialProducts: Product[];
  user: User;
}

export default function EolProductsClient({
  initialProducts,
  user,
}: EolProductsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleMarkAsRecycled = (productId: string) => {
    if (!user) return;
    setProcessingId(productId);
    startTransition(async () => {
      try {
        const updatedProduct = await markAsRecycled(productId, user.id);
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
        <CardTitle>End-of-Life Products</CardTitle>
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
            {initialProducts.map(product => (
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
                      isPending || product.endOfLifeStatus === 'Recycled'
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
             {initialProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
