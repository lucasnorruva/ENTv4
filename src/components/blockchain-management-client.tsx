// src/components/blockchain-management-client.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import type { User, Product, Company } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw } from 'lucide-react';

import AnchoringTab from './trust-hub/anchoring-tab';
import IssuersTab from './trust-hub/issuers-tab';
import ZkpTab from './trust-hub/zkp-tab';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { getCompanies } from '@/lib/auth';
import { getProducts } from '@/lib/actions';

interface BlockchainManagementClientProps {
  user: User;
  initialProducts: Product[];
  initialCompanies: Company[];
}

export default function BlockchainManagementClient({
  user,
  initialProducts,
  initialCompanies,
}: BlockchainManagementClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [refreshedProducts, refreshedCompanies] = await Promise.all([
        getProducts(user.id),
        getCompanies(),
      ]);
      setProducts(refreshedProducts);
      setCompanies(refreshedCompanies);
      toast({ title: 'Data refreshed' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user.id, toast]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Trust &amp; Verification Hub
          </h1>
          <p className="text-muted-foreground">
            Manage the on-chain lifecycle of Digital Product Passports, issuer
            trust, and advanced cryptographic proofs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} disabled={isLoading}>
            <RefreshCw
              className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')}
            />
            Refresh Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue="anchoring">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="anchoring">Anchoring</TabsTrigger>
          <TabsTrigger value="issuers">Issuers &amp; Revocation</TabsTrigger>
          <TabsTrigger value="zkp">Zero-Knowledge Proofs</TabsTrigger>
        </TabsList>
        <TabsContent value="anchoring" className="mt-4">
          <AnchoringTab products={products} user={user} />
        </TabsContent>
        <TabsContent value="issuers" className="mt-4">
          <IssuersTab companies={companies} user={user} onDataChange={fetchData} />
        </TabsContent>
        <TabsContent value="zkp" className="mt-4">
          <ZkpTab products={products} user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
