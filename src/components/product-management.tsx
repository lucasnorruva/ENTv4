// src/components/product-management.tsx
'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';

import type { Product, User, CompliancePath } from '@/types';
import { UserRoles } from '@/lib/constants';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ProductForm from './product-form';
import ProductTable from './product-table';
import {
  deleteProduct,
  getProducts,
  submitForReview,
  recalculateScore,
} from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { hasRole } from '@/lib/auth-utils';

interface ProductManagementProps {
  user: User;
  compliancePaths: CompliancePath[];
}

export default function ProductManagement({
  user,
  compliancePaths,
}: ProductManagementProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const canCreate =
    hasRole(user, UserRoles.ADMIN) || hasRole(user, UserRoles.SUPPLIER);

  useEffect(() => {
    // A function to fetch products from our local mock data source
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const fetchedProducts = await getProducts(user.id);
        // Sort products by lastUpdated date descending
        const sortedProducts = fetchedProducts.sort(
          (a, b) =>
            new Date(b.lastUpdated).getTime() -
            new Date(a.lastUpdated).getTime(),
        );
        setProducts(sortedProducts);
      } catch (error) {
        toast({
          title: 'Error Fetching Data',
          description: 'Could not load product data. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [user.id, toast, isPending]); // Rerun when user changes or an action finishes

  const handleCreateNew = () => {
    setSelectedProduct(null);
    setIsSheetOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsSheetOpen(true);
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteProduct(id, user.id);
      toast({
        title: 'Product Deleted',
        description: 'The product passport has been successfully deleted.',
      });
    });
  };

  const handleSubmitForReview = (id: string) => {
    startTransition(async () => {
      try {
        const reviewedProduct = await submitForReview(id, user.id);
        toast({
          title: 'Product Submitted',
          description: `"${reviewedProduct.productName}" has been submitted for review.`,
        });
      } catch (error) {
        toast({
          title: 'Submission Failed',
          description: 'There was an error submitting the product for review.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleRecalculateScore = (id: string, productName: string) => {
    startTransition(async () => {
      try {
        await recalculateScore(id, user.id);
        toast({
          title: 'AI Recalculation Started',
          description: `AI data for "${productName}" is being updated. The table will refresh automatically.`,
        });
      } catch (error) {
        toast({
          title: 'Recalculation Failed',
          description: 'There was an error triggering the recalculation.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleSave = (savedProduct: Product) => {
    startTransition(() => {
      const index = products.findIndex(p => p.id === savedProduct.id);
      if (index > -1) {
        const newProducts = [...products];
        newProducts[index] = savedProduct;
        setProducts(newProducts);
      } else {
        setProducts([savedProduct, ...products]);
      }
      setIsSheetOpen(false);
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Product Passports</CardTitle>
              <CardDescription>
                Manage and display digital product passports for your products.
              </CardDescription>
            </div>
            {canCreate && (
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" /> Create New
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ProductTable
              products={products}
              user={user}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSubmitForReview={handleSubmitForReview}
              onRecalculateScore={handleRecalculateScore}
            />
          )}
        </CardContent>
      </Card>
      {canCreate && (
        <ProductForm
          isOpen={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          product={selectedProduct}
          onSave={handleSave}
          user={user}
          compliancePaths={compliancePaths}
        />
      )}
    </>
  );
}
