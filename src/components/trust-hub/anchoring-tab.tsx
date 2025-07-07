// src/components/trust-hub/anchoring-tab.tsx
'use client';

import React, { useState, useTransition, useMemo } from 'react';
import type { Product, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Fingerprint, History, CheckCircle, Hourglass, ShieldAlert, Wallet, Sparkles, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { anchorProductOnChain, bulkAnchorProducts } from '@/lib/actions';
import { Checkbox } from '../ui/checkbox';

interface AnchoringTabProps {
  initialProducts: Product[];
  user: User;
  onDataChange: () => void;
}

export default function AnchoringTab({ initialProducts, user, onDataChange }: AnchoringTabProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const { toast } = useToast();

  const productsReadyToMint = useMemo(() => {
    return initialProducts.filter(p => p.verificationStatus === 'Verified' && !p.blockchainProof && !p.isMinting);
  }, [initialProducts]);

  const mintingActivity = useMemo(() => {
    return initialProducts
      .filter(p => p.blockchainProof || p.isMinting)
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  }, [initialProducts]);

  const handleAnchorProduct = (productId: string) => {
    startTransition(async () => {
      toast({ title: 'Anchoring started...', description: `Product ID: ${productId}` });
      try {
        await anchorProductOnChain(productId, user.id);
        toast({ title: 'Success!', description: 'Product successfully anchored.' });
        onDataChange();
      } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    });
  };

  const handleBulkAnchor = () => {
    if (selectedProductIds.length === 0) return;
    startTransition(async () => {
      toast({ title: 'Bulk Anchoring Started', description: `Anchoring ${selectedProductIds.length} products...` });
      try {
        await bulkAnchorProducts(selectedProductIds, user.id);
        toast({ title: 'Success!', description: 'Bulk anchoring process initiated.' });
        setSelectedProductIds([]);
        onDataChange();
      } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    });
  };

  const handleSelectProduct = (productId: string, checked: boolean | 'indeterminate') => {
    if (checked) {
      setSelectedProductIds(prev => [...prev, productId]);
    } else {
      setSelectedProductIds(prev => prev.filter(id => id !== productId));
    }
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked) {
      setSelectedProductIds(productsReadyToMint.map(p => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };
  
  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wallet/> Custodial Wallet</CardTitle>
          <CardDescription>This is the platform-managed wallet used for all on-chain transactions. Gas fees are handled automatically.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><strong>Address:</strong> <span className="font-mono text-xs">0x1234...abcd</span> (Mock)</div>
            <div><strong>Balance:</strong> <span className="font-mono text-xs">1.23 MATIC</span> (Mock)</div>
            <div><strong>Network:</strong> <span className="font-mono text-xs">Polygon Amoy Testnet</span></div>
            <div><strong>Status:</strong> <Badge variant="default">Operational</Badge></div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles/> Minting Engine</CardTitle>
          <CardDescription>Verified products ready to be anchored on the blockchain. Anchoring creates an immutable proof of the passport's data.</CardDescription>
        </CardHeader>
        <CardContent>
          {productsReadyToMint.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No products are currently ready for minting.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {productsReadyToMint.map(product => (
                  <Card key={product.id} className="relative">
                    <div className="absolute top-2 left-2 z-10">
                      <Checkbox
                        checked={selectedProductIds.includes(product.id)}
                        onCheckedChange={(checked) => handleSelectProduct(product.id, checked)}
                        />
                    </div>
                    <CardContent className="p-0">
                      <Image src={product.productImage} alt={product.productName} width={300} height={200} className="aspect-video object-cover rounded-t-lg" data-ai-hint="product photo" />
                    </CardContent>
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm font-medium line-clamp-1">{product.productName}</CardTitle>
                      <CardDescription className="text-xs">{product.id}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        {productsReadyToMint.length > 0 && (
            <CardFooter className="border-t pt-4">
                <div className="flex w-full justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="select-all"
                            checked={selectedProductIds.length > 0 && selectedProductIds.length === productsReadyToMint.length}
                            onCheckedChange={handleSelectAll}
                        />
                        <label htmlFor="select-all" className="text-sm font-medium">{selectedProductIds.length} selected</label>
                    </div>
                    <Button onClick={handleBulkAnchor} disabled={isPending || selectedProductIds.length === 0}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Fingerprint className="mr-2 h-4 w-4"/>}
                        Anchor Selected ({selectedProductIds.length})
                    </Button>
                </div>
            </CardFooter>
        )}
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><History/> Minting Activity Log</CardTitle>
          <CardDescription>A complete history of all on-chain anchoring transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tx Hash</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mintingActivity.map(p => (
                <TableRow key={p.id}>
                  <TableCell>{p.productName}</TableCell>
                  <TableCell>
                    {p.isMinting ? <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin"/>Minting...</Badge> : <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1"/>Anchored</Badge>}
                  </TableCell>
                  <TableCell>
                    {p.blockchainProof ? <a href={p.blockchainProof.explorerUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-primary hover:underline">{p.blockchainProof.txHash.slice(0, 10)}...{p.blockchainProof.txHash.slice(-8)}</a> : 'N/A'}
                  </TableCell>
                  <TableCell>{formatDistanceToNow(new Date(p.lastUpdated), { addSuffix: true })}</TableCell>
                </TableRow>
              ))}
              {mintingActivity.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">No minting activity yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
