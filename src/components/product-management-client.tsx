// src/components/product-management-client.tsx
'use client';

import React, {
  useState,
  useTransition,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import Link from 'next/link';
import { Plus, Loader2, Upload, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

import type { Product, User, CompliancePath } from '@/types';
import { UserRoles} from '@/lib/constants';
import type { CreateProductFromImageOutput } from '@/types/ai-outputs';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductTable from './product-table';
import {
  getProducts,
  deleteProduct,
  submitForReview,
  recalculateScore,
  bulkDeleteProducts,
  bulkSubmitForReview,
  bulkArchiveProducts,
} from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { hasRole } from '@/lib/auth-utils';
import ProductImportDialog from './product-import-dialog';
import ProductCreationFromImageDialog from './product-creation-from-image-dialog';

interface ProductManagementClientProps {
  user: User;
}

export default function ProductManagementClient({
  user,

}: ProductManagementClientProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isCreateFromImageOpen, setIsCreateFromImageOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const roleSlug = user.roles[0].toLowerCase().replace(/ /g, '-');

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const productsData = await getProducts(user.id);
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user.id, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const canCreate =
    hasRole(user, UserRoles.ADMIN) || hasRole(user, UserRoles.SUPPLIER);

  const handleImport = useCallback(() => setIsImportOpen(true), []);
  const handleCreateFromImage = useCallback(
    () => setIsCreateFromImageOpen(true),
    [],
  );

  const handleImportSave = useCallback(() => {
    toast({
      title: 'Import in Progress',
      description: 'New products will appear in the table shortly.',
    });
    setIsImportOpen(false);
    fetchProducts(); // Refresh data after import
  }, [fetchProducts, toast]);

  const handleAnalysisComplete = useCallback(
    (data: CreateProductFromImageOutput) => {
      const query = new URLSearchParams({
        productName: data.productName,
        productDescription: data.productDescription,
        category: data.category,
      }).toString();
      router.push(`/dashboard/${roleSlug}/products/new?${query}`);
    },
    [router, roleSlug],
  );

  const [isPending, startTransition] = useTransition();

  const handleBulkAction = useCallback(
    async (
      action: (ids: string[], userId: string) => Promise<any>,
      productIds: string[],
      successMessage: string,
    ) => {
      startTransition(async () => {
        await action(productIds, user.id);
        fetchProducts(); // Refresh data
        toast({ title: successMessage });
      });
    },
    [fetchProducts, toast, user.id],
  );

  const handleDelete = useCallback(
    (id: string) => {
      startTransition(async () => {
        await deleteProduct(id, user.id);
        fetchProducts(); // Refresh data
        toast({ title: 'Product Deleted' });
      });
    },
    [fetchProducts, toast, user.id],
  );

  const handleSubmitForReview = useCallback(
    (id: string) => {
      startTransition(async () => {
        await submitForReview(id, user.id);
        fetchProducts(); // Refresh data
        toast({ title: 'Product Submitted' });
      });
    },
    [fetchProducts, toast, user.id],
  );

  const handleRecalculateScore = useCallback(
    (id: string, name: string) => {
      startTransition(async () => {
        await recalculateScore(id, user.id);
        fetchProducts(); // Refresh data
        toast({ title: `Recalculating score for ${name}...` });
      });
    },
    [fetchProducts, toast, user.id],
  );

  const handleBulkDelete = useCallback(
    (ids: string[]) =>
      handleBulkAction(
        bulkDeleteProducts,
        ids,
        `Deleted ${ids.length} products.`,
      ),
    [handleBulkAction],
  );

  const handleBulkSubmit = useCallback(
    (ids: string[]) =>
      handleBulkAction(
        bulkSubmitForReview,
        ids,
        `Submitted ${ids.length} products.`,
      ),
    [handleBulkAction],
  );

  const handleBulkArchive = useCallback(
    (ids: string[]) =>
      handleBulkAction(
        bulkArchiveProducts,
        ids,
        `Archived ${ids.length} products.`,
      ),
    [handleBulkAction],
  );

  const filteredProducts = useMemo(() => {
    switch (activeTab) {
      case 'needsAction':
        return products.filter(
          p => p.status === 'Draft' || p.verificationStatus === 'Failed',
        );
      case 'live':
        return products.filter(
          p => p.status === 'Published' && p.verificationStatus === 'Verified',
        );
      case 'archived':
        return products.filter(p => p.status === 'Archived');
      default:
        return products.filter(p => p.status !== 'Archived');
    }
  }, [products, activeTab]);

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
                <Button asChild>
                  <Link href={`/dashboard/${roleSlug}/products/new`}>
                    <Plus className="mr-2 h-4 w-4" /> Create New
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="all"
            className="w-full"
            onValueChange={setActiveTab}
          >
            <TabsList>
              <TabsTrigger value="all">
                All ({products.filter(p => p.status !== 'Archived').length})
              </TabsTrigger>
              <TabsTrigger value="needsAction">
                Needs Action (
                {
                  products.filter(
                    p =>
                      p.status === 'Draft' || p.verificationStatus === 'Failed',
                  ).length
                }
                )
              </TabsTrigger>
              <TabsTrigger value="live">
                Live (
                {
                  products.filter(
                    p =>
                      p.status === 'Published' &&
                      p.verificationStatus === 'Verified',
                  ).length
                }
                )
              </TabsTrigger>
              <TabsTrigger value="archived">
                Archived ({products.filter(p => p.status === 'Archived').length}
                )
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {isLoading ? (
            <div className="flex justify-center items-center h-96">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ProductTable
              products={filteredProducts}
              user={user}
              isLoading={isLoading}
              isProcessingAction={isPending}
              onDelete={handleDelete}
              onSubmitForReview={handleSubmitForReview}
              onRecalculateScore={handleRecalculateScore}
              onBulkDelete={handleBulkDelete}
              onBulkSubmit={handleBulkSubmit}
              onBulkArchive={handleBulkArchive}
            />
          )}
        </CardContent>
      </Card>
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
