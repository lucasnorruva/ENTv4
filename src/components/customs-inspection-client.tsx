// src/components/customs-inspection-client.tsx
'use client';

import { useState, useTransition } from 'react';
import type { Product, User, CustomsStatus } from '@/types';
import { getProductById } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Globe, AlertTriangle } from 'lucide-react';
import ProductCard from './product-card';
import CustomsInspectionDialog from './customs-inspection-dialog';
import { can } from '@/lib/permissions';

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

  const handleInspectionComplete = (updatedProduct: Product) => {
    setProduct(updatedProduct);
    toast({
        title: 'Inspection Recorded',
        description: `Customs status for ${updatedProduct.productName} has been updated.`,
    });
  };

  const roleSlug = user.roles[0]?.toLowerCase().replace(/ /g, '-') || 'auditor';

  return (
    <>
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
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
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
      <div className="mt-6">
        {isSearching ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-md flex items-center gap-2 max-w-md mx-auto">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        ) : product ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <ProductCard product={product} roleSlug={roleSlug} />
            <Card className="md:col-span-1 lg:col-span-2 flex flex-col items-center justify-center text-center p-6">
              <Globe className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold">Ready for Inspection</h3>
              <p className="text-muted-foreground mt-2 mb-4">
                Review the product details and then record the customs
                inspection event.
              </p>
              {can(user, 'product:customs_inspect') ? (
                <Button onClick={() => setIsDialogOpen(true)}>
                  Perform Inspection
                </Button>
              ) : (
                  <p className="text-sm text-destructive">You do not have permission to perform inspections.</p>
              )}
            </Card>
          </div>
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
