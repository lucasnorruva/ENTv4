// src/components/product-scanner.tsx
'use client';

import { useState, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  QrCode,
  Search,
  Recycle,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { getProductById, markAsRecycled } from '@/lib/actions';
import type { Product, User } from '@/types';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';

interface ProductScannerProps {
  user: User;
}

export default function ProductScanner({ user }: ProductScannerProps) {
  const [productId, setProductId] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, startSearchTransition] = useTransition();
  const [isRecycling, startRecycleTransition] = useTransition();
  const { toast } = useToast();

  const handleSearch = () => {
    if (!productId) return;
    setError(null);
    setProduct(null);
    startSearchTransition(async () => {
      try {
        const foundProduct = await getProductById(productId, user.id);
        if (foundProduct) {
          setProduct(foundProduct);
        } else {
          setError(
            'Product not found or you do not have permission to view it.',
          );
        }
      } catch (err) {
        setError('An error occurred while searching for the product.');
      }
    });
  };

  const handleRecycle = () => {
    if (!product) return;
    startRecycleTransition(async () => {
      try {
        await markAsRecycled(product.id, user.id);
        toast({
          title: 'Success',
          description: `Product "${product.productName}" has been marked as recycled.`,
        });
        setProduct(prev =>
          prev ? { ...prev, endOfLifeStatus: 'Recycled' } : null,
        );
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to mark product as recycled.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode /> Product EOL Scanner
        </CardTitle>
        <CardDescription>
          Enter a product ID to simulate scanning and view its materials for
          recycling.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter Product ID (e.g., pp-001)"
            value={productId}
            onChange={e => setProductId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Find
          </Button>
        </div>

        {error && (
          <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-md flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {product && (
          <Card>
            <CardHeader className="flex flex-row gap-4 items-start">
              <Image
                src={product.productImage}
                alt={product.productName}
                width={100}
                height={100}
                className="rounded-lg border object-cover"
                data-ai-hint="product photo"
              />
              <div className="flex-1">
                <CardTitle>{product.productName}</CardTitle>
                <CardDescription>by {product.supplier}</CardDescription>
                <Badge
                  variant={
                    product.endOfLifeStatus === 'Recycled'
                      ? 'default'
                      : 'secondary'
                  }
                  className="mt-2"
                >
                  {product.endOfLifeStatus ?? 'Active'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Package className="h-4 w-4" /> Material Composition
              </h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                {product.materials.map((mat, index) => (
                  <li key={index}>
                    {mat.name} ({mat.percentage ?? 'N/A'}%)
                  </li>
                ))}
                {product.materials.length === 0 && (
                  <li>No material data available.</li>
                )}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={handleRecycle}
                disabled={
                  isRecycling || product.endOfLifeStatus === 'Recycled'
                }
              >
                {isRecycling ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Recycle className="mr-2 h-4 w-4" />
                )}
                {product.endOfLifeStatus === 'Recycled'
                  ? 'Already Recycled'
                  : 'Mark as Recycled'}
              </Button>
            </CardFooter>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
