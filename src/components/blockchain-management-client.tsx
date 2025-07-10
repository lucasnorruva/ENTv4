// src/components/blockchain-management-client.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import type { User, Product, Company } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw } from 'lucide-react';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Collections } from '@/lib/constants';

import AnchoringTab from './trust-hub/anchoring-tab';
import IssuersTab from './trust-hub/issuers-tab';
import ZkpTab from './trust-hub/zkp-tab';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface BlockchainManagementClientProps {
  user: User;
}

export default function BlockchainManagementClient({
  user,
}: BlockchainManagementClientProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    // Data is now fetched via listeners, so this just acts as a manual trigger indicator.
    await new Promise(res => setTimeout(res, 500)); // Simulate refetch delay
    setIsLoading(false);
    toast({ title: 'Data refreshed' });
  }, [toast]);

  useEffect(() => {
    const qProducts = collection(db, Collections.PRODUCTS);
    const unsubProducts = onSnapshot(qProducts, snapshot => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setIsLoading(false);
    });

    const qCompanies = collection(db, Collections.COMPANIES);
    const unsubCompanies = onSnapshot(qCompanies, snapshot => {
      setCompanies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company)));
    });

    return () => {
      unsubProducts();
      unsubCompanies();
    };
  }, []);

  if (isLoading && products.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
