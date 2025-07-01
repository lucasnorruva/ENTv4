// src/components/eol-products-client.tsx
'use client';

import React, { useState, useTransition, useEffect } from 'react';
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
import { Loader2, Recycle } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Collections, UserRoles } from '@/lib/constants';

interface EolProductsClientProps {
  user: User;
}

export default function EolProductsClient({ user }: EolProductsClientProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    let q = query(collection(db, Collections.PRODUCTS));

    if (!user.roles.includes(UserRoles.ADMIN)) {
      q = query(q, where('companyId', '==', user.companyId));
    }

    const unsubscribe = onSnapshot(
      q,
      querySnapshot => {
        const productsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate().toISOString(),
            updatedAt: data.updatedAt?.toDate().toISOString(),
            lastUpdated: data.lastUpdated?.toDate().toISOString(),
          } as Product;
        });
        setProducts(productsData);
        setIsLoading(false);
      },
      error => {
        console.error('Error fetching EOL products:', error);
        toast({
          title: 'Error',
          description: 'Failed to load product data.',
          variant: 'destructive',
        });
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user.companyId, user.roles, toast]);

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
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-48 text-center"
                >
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : products.length > 0 ? (
              products.map(product => (
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
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <Recycle className="h-12 w-12 text-muted-foreground" />
                    <h3 className="text-xl font-semibold">No Products Found</h3>
                    <p className="text-muted-foreground">
                      There are no products available to process.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
