// src/components/blockchain-management-client.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { User, Company } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AnchoringTab from './trust-hub/anchoring-tab';
import IssuersTab from './trust-hub/issuers-tab';
import ZkpTab from './trust-hub/zkp-tab';
import { getCompanies, getUsers } from '@/lib/auth';
import { getProducts } from '@/lib/actions';
import { Loader2 } from 'lucide-react';

interface BlockchainManagementClientProps {
  user: User;
}

export default function BlockchainManagementClient({
  user,
}: BlockchainManagementClientProps) {
  const [initialData, setInitialData] = useState<{
    products: any[];
    companies: Company[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [products, companies] = await Promise.all([
        getProducts(user.id),
        getCompanies(),
      ]);
      setInitialData({ products, companies });
    } catch (err) {
      toast({
        title: 'Error fetching data',
        description: 'Could not load initial platform data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, user.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading || !initialData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Trust & Verification Hub
        </h1>
        <p className="text-muted-foreground">
          Manage the on-chain lifecycle of Digital Product Passports, issuer
          trust, and advanced cryptographic proofs.
        </p>
      </div>
      <Tabs defaultValue="anchoring" className="w-full">
        <TabsList>
          <TabsTrigger value="anchoring">Anchoring</TabsTrigger>
          <TabsTrigger value="issuers">Issuers & Revocation</TabsTrigger>
          <TabsTrigger value="zkp">Zero-Knowledge Proofs</TabsTrigger>
        </TabsList>
        <TabsContent value="anchoring" className="mt-4">
          <AnchoringTab
            initialProducts={initialData.products}
            user={user}
            onDataChange={fetchData}
          />
        </TabsContent>
        <TabsContent value="issuers" className="mt-4">
          <IssuersTab
            initialCompanies={initialData.companies}
            user={user}
            onDataChange={fetchData}
          />
        </TabsContent>
        <TabsContent value="zkp" className="mt-4">
          <ZkpTab
            initialProducts={initialData.products}
            user={user}
            onDataChange={fetchData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
