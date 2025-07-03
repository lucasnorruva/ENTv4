// src/components/product-management-client.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { Plus, Loader2, Upload, Sparkles } from 'lucide-react';
import type { Product, User, CompliancePath } from '@/types';
import { UserRoles } from '@/lib/constants';
import type { CreateProductFromImageOutput } from '@/types/ai-outputs';

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
  submitForReview,
  recalculateScore,
} from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { hasRole } from '@/lib/auth-utils';
import ProductImportDialog from './product-import-dialog';
import ProductCreationFromImageDialog from './product-creation-from-image-dialog';

interface ProductManagementClientProps {
  initialProducts: Product[];
  user: User;
  compliancePaths: CompliancePath[];
  initialFilter?: string;
}

export default function ProductManagementClient({
  initialProducts,
  user,
  compliancePaths,
  initialFilter,
}: ProductManagementClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false); // In a real app with Firestore listeners, this would be true initially
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isCreateFromImageOpen, setIsCreateFromImageOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const canCreate =
    hasRole(user, UserRoles.ADMIN) || hasRole(user, UserRoles.SUPPLIER);

  const handleCreateNew = () => {
    setSelectedProduct(null);
    setIsSheetOpen(true);
  };

  const handleImport = () => {
    setIsImportOpen(true);
  };

  const handleCreateFromImage = () => {
    setIsCreateFromImageOpen(true);
  };

  const handleAnalysisComplete = (data: CreateProductFromImageOutput) => {
    const partialProduct: Partial<Product> = {
      productName: data.productName,
      productDescription: data.productDescription,
      category: data.category,
      status: 'Draft',
    };
    setSelectedProduct(partialProduct as Product);
    setIsSheetOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsSheetOpen(true);
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      setProducts(prev => prev.filter(p => p.id !== id));
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
        setProducts(prev =>
          prev.map(p => (p.id === id ? reviewedProduct : p)),
        );
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
        setProducts(prev =>
          prev.map(p =>
            p.id === id ? { ...p, isProcessing: true } : p,
          ),
        );
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
    setProducts(prev => {
      const exists = prev.some(p => p.id === savedProduct.id);
      if (exists) {
        return prev.map(p => (p.id === savedProduct.id ? savedProduct : p));
      }
      return [savedProduct, ...prev];
    });
    setIsSheetOpen(false);
  };

  const handleImportSave = () => {
    // This is a placeholder; a real implementation would refetch or update the product list
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000); // Simulate refetch
    setIsImportOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>My Product Passports</CardTitle>
              <CardDescription>
                Manage and display digital product passports for your products.
              </CardDescription>
            </div>
            {canCreate && (
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleImport}>
                  <Upload className="mr-2 h-4 w-4" /> Import
                </Button>
                <Button variant="outline" onClick={handleCreateFromImage}>
                  <Sparkles className="mr-2 h-4 w-4" /> Create from Image
                </Button>
                <Button onClick={handleCreateNew}>
                  <Plus className="mr-2 h-4 w-4" /> Create New
                </Button>
              </div>
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
              initialFilter={initialFilter}
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
      {canCreate && (
        <ProductImportDialog
          isOpen={isImportOpen}
          onOpenChange={setIsImportOpen}
          onSave={handleImportSave}
          user={user}
        />
      )}
      {canCreate && (
        <ProductCreationFromImageDialog
          isOpen={isCreateFromImageOpen}
          onOpenChange={setIsCreateFromImageOpen}
          onAnalysisComplete={handleAnalysisComplete}
          user={user}
        />
      )}
    </>
  );
}
