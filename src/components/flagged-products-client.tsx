// src/components/flagged-products-client.tsx
'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { resolveComplianceIssue } from '@/lib/actions';
import type { Product, User } from '@/types';

interface FlaggedProductsClientProps {
  initialProducts: Product[];
  user: User;
}

export default function FlaggedProductsClient({
  initialProducts,
  user,
}: FlaggedProductsClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleResolve = (productId: string) => {
    startTransition(async () => {
      try {
        const updatedProduct = await resolveComplianceIssue(productId, user.id);
        setProducts(current => current.filter(p => p.id !== productId));
        toast({
          title: 'Issue Resolved',
          description: `Product "${updatedProduct.productName}" has been sent back to the supplier for revision.`,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to resolve the compliance issue.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
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
        {products.map(product => (
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
                formatDistanceToNow(new Date(product.lastVerificationDate), {
                  addSuffix: true,
                })}
            </TableCell>
            <TableCell className="text-right">
              <Button asChild variant="outline" size="sm" className="mr-2">
                <Link href={`/products/${product.id}`} target="_blank">
                  View Details
                </Link>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleResolve(product.id)}
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Mark as Resolved
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {products.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="h-24 text-center">
              No products are currently flagged for non-compliance.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
