// src/components/flagged-products-client.tsx
'use client';

import React, { useTransition, useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, ShieldCheck } from 'lucide-react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Collections } from '@/lib/constants';

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
  user: User;
}

export default function FlaggedProductsClient({
  user,
}: FlaggedProductsClientProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const q = query(
      collection(db, Collections.PRODUCTS),
      where('verificationStatus', '==', 'Failed'),
      orderBy('lastVerificationDate', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const flaggedProducts = snapshot.docs.map(
          doc => ({ id: doc.id, ...doc.data() }) as Product,
        );
        setProducts(flaggedProducts);
        setIsLoading(false);
      },
      error => {
        console.error('Error fetching flagged products:', error);
        toast({
          title: 'Error',
          description: 'Could not load flagged products.',
          variant: 'destructive',
        });
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [toast]);

  const handleResolve = (productId: string) => {
    startTransition(async () => {
      try {
        const updatedProduct = await resolveComplianceIssue(productId, user.id);
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
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={4} className="h-48 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </TableCell>
          </TableRow>
        ) : products.length > 0 ? (
          products.map(product => (
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
                  <Link
                    href={`/dashboard/compliance-manager/products/${product.id}`}
                    target="_blank"
                  >
                    View Details
                  </Link>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleResolve(product.id)}
                  disabled={isPending}
                >
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Mark as Resolved
                </Button>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={4} className="h-48 text-center">
              <div className="flex flex-col items-center justify-center gap-4">
                <ShieldCheck className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-xl font-semibold">No Flagged Products</h3>
                <p className="text-muted-foreground">
                  All products are currently compliant.
                </p>
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
