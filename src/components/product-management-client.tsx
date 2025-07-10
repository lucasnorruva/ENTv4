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
import { Plus, Upload, Sparkles, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Collections } from '@/lib/constants';

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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductTable from './product-table';
import {
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
  compliancePaths: CompliancePath[];
}

export default function ProductManagementClient({
  user,
  compliancePaths,
}: ProductManagementClientProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isCreateFromImageOpen, setIsCreateFromImageOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setIsLoading(true);
    const isAdmin = hasRole(user, UserRoles.ADMIN);
    
    const q = isAdmin
      ? query(collection(db, Collections.PRODUCTS))
      : query(collection(db, Collections.PRODUCTS), where('companyId', '==', user.companyId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching products:", error);
        toast({ title: 'Error', description: 'Could not fetch products.', variant: 'destructive' });
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user.id, user.companyId, toast]);

  const roleSlug = user.roles[0].toLowerCase().replace(/ /g, '-');

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
    // Real-time listener handles the update, no refresh needed.
  }, [toast]);

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

  const handleAction = useCallback((action: () => Promise<any>, successMessage: string) => {
    startTransition(async () => {
        await action();
        toast({ title: successMessage });
        // Real-time listener handles UI updates, so no router.refresh() needed.
    });
  }, [toast, startTransition]);

  const handleDelete = useCallback((id: string) => handleAction(() => deleteProduct(id, user.id), 'Product Deleted'), [handleAction, user.id]);
  const handleSubmitForReview = useCallback((id: string) => handleAction(() => submitForReview(id, user.id), 'Product Submitted'), [handleAction, user.id]);
  const handleRecalculateScore = useCallback((id: string, name: string) => handleAction(() => recalculateScore(id, user.id), `Recalculating score for ${name}...`), [handleAction, user.id]);
  const handleBulkDelete = useCallback((ids: string[]) => handleAction(() => bulkDeleteProducts(ids, user.id), `Deleted ${ids.length} products.`), [handleAction, user.id]);
  const handleBulkSubmit = useCallback((ids: string[]) => handleAction(() => bulkSubmitForReview(ids, user.id), `Submitted ${ids.length} products.`), [handleAction, user.id]);
  const handleBulkArchive = useCallback((ids: string[]) => handleAction(() => bulkArchiveProducts(ids, user.id), `Archived ${ids.length} products.`), [handleAction, user.id]);

  const filteredProducts = useMemo(() => {
    if (isLoading) return [];
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
  }, [products, activeTab, isLoading]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>My Product Passports</CardTitle>
              <CardDescription>
                Manage and display digital product passports for your products.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

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

          <ProductTable
            products={filteredProducts}
            user={user}
            isProcessingAction={isPending}
            onDelete={handleDelete}
            onSubmitForReview={handleSubmitForReview}
            onRecalculateScore={handleRecalculateScore}
            onBulkDelete={handleBulkDelete}
            onBulkSubmit={handleBulkSubmit}
            onBulkArchive={handleBulkArchive}
          />
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
