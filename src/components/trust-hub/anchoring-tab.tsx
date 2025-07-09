
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
import { Loader2, Fingerprint, History, CheckCircle, Wallet, Sparkles, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { bulkAnchorProducts } from '@/lib/actions';
import { Checkbox } from '../ui/checkbox';
import Link from 'next/link';

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
    setSelectedProductIds(prev =>
        checked ? [...prev, productId] : prev.filter(id => id !== productId)
    );
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    setSelectedProductIds(checked ? productsReadyToMint.map(p => p.id) : []);
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
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                     <Checkbox
                        checked={selectedProductIds.length > 0 && selectedProductIds.length === productsReadyToMint.length}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Supplier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsReadyToMint.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No products are currently ready for minting.
                    </TableCell>
                  </TableRow>
                ) : (
                  productsReadyToMint.map(product => (
                    <TableRow key={product.id}>
                       <TableCell>
                          <Checkbox
                              checked={selectedProductIds.includes(product.id)}
                              onCheckedChange={(checked) => handleSelectProduct(product.id, checked)}
                          />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                            <Image src={product.productImage} alt={product.productName} width={40} height={40} className="rounded-md object-cover" data-ai-hint="product photo" />
                            <span className="font-medium">{product.productName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.supplier}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
          </Table>
        </CardContent>
        {productsReadyToMint.length > 0 && (
            <CardFooter className="border-t pt-4">
                <div className="flex w-full justify-end items-center">
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
                <TableHead className="text-right">Actions</TableHead>
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
                   <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/admin/products/${p.id}`}>
                            <Edit className="h-3 w-3 mr-2"/>
                            View Details
                        </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {mintingActivity.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">No minting activity yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
