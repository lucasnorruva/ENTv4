// src/components/customs-inspection-client.tsx
'use client';

import { useState, useTransition, useCallback } from 'react';
import type { Product, User } from '@/types';
import { getProductById } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
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
import { Loader2, Search, Globe, AlertTriangle, Fingerprint } from 'lucide-react';
import Image from 'next/image';
import CustomsInspectionDialog from './customs-inspection-dialog';
import { can } from '@/lib/permissions';
import { Badge } from './ui/badge';

interface CustomsInspectionClientProps {
  user: User;
}

export default function CustomsInspectionClient({
  user,
}: CustomsInspectionClientProps) {
  const [productId, setProductId] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, startSearchTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const findProduct = useCallback(
    (id: string) => {
      if (!id) return;

      setError(null);
      setProduct(null);

      startSearchTransition(async () => {
        try {
          const foundProduct = await getProductById(id, user.id);
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
    },
    [user.id],
  );

  const handleInspectionComplete = (updatedProduct: Product) => {
    setProduct(updatedProduct);
    toast({
      title: 'Inspection Recorded',
      description: `Customs status for ${updatedProduct.productName} has been updated.`,
    });
  };

  return (
    <>
      <div className="space-y-6">
        {!product && (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Find Product by ID</CardTitle>
              <CardDescription>
                Enter a product ID to begin the inspection process.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., pp-001"
                  value={productId}
                  onChange={e => setProductId(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && findProduct(productId)}
                />
                <Button onClick={() => findProduct(productId)} disabled={isSearching}>
                  {isSearching ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isSearching ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Alert variant="destructive" className="max-w-md mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Search Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : product ? (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Inspection for: {product.productName}</CardTitle>
                  <CardDescription>
                    Review the product details below before recording the
                    inspection event.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setProduct(null)}>
                    New Search
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <Image
                  src={product.productImage}
                  alt={product.productName}
                  width={400}
                  height={400}
                  className="rounded-lg border object-cover w-full aspect-square"
                  data-ai-hint="product photo"
                />
              </div>
              <div className="md:col-span-2 space-y-4">
                 <h4 className="font-semibold text-lg">Key Details</h4>
                 <div className="text-sm space-y-2 text-muted-foreground">
                    <p><strong>Supplier:</strong> {product.supplier}</p>
                    <p><strong>Category:</strong> {product.category}</p>
                    <p className="flex items-center gap-2"><strong>GTIN:</strong> <span className="font-mono">{product.gtin || 'N/A'}</span></p>
                    <p>
                        <strong>Verification Status:</strong>{' '}
                        <Badge variant={product.verificationStatus === 'Verified' ? 'default' : 'destructive'}>
                            {product.verificationStatus}
                        </Badge>
                    </p>
                    <p>
                        <strong>Last Customs Event:</strong>{' '}
                        {product.customs ? (
                             <Badge variant={product.customs.status === 'Cleared' ? 'secondary' : 'destructive'}>
                                {product.customs.status} at {product.customs.location}
                             </Badge>
                        ) : (
                            <Badge variant="outline">None</Badge>
                        )}
                    </p>
                 </div>
              </div>
            </CardContent>
            <CardFooter>
            {can(user, 'product:customs_inspect') ? (
                <Button className="w-full" onClick={() => setIsDialogOpen(true)}>
                  <Globe className="mr-2 h-4 w-4" />
                  Perform Inspection
                </Button>
              ) : (
                  <p className="text-sm text-center w-full text-destructive">You do not have permission to perform inspections.</p>
              )}
            </CardFooter>
          </Card>
        ) : null}
      </div>

      <CustomsInspectionDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        product={product}
        user={user}
        onSave={handleInspectionComplete}
      />
    </>
  );
}
