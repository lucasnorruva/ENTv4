// src/components/blockchain-management-client.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Product } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Fingerprint, History, CheckCircle, Hourglass, ShieldAlert, Wallet, Sparkles, AlertCircle, RefreshCw, Cog } from 'lucide-react';
import { getProducts } from '@/lib/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { cn } from '@/lib/utils';

interface BlockchainManagementClientProps {
  user: User;
}

export default function BlockchainManagementClient({ user }: BlockchainManagementClientProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const { toast } = useToast();
  const router = useRouter();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const allProducts = await getProducts(user.id);
      setProducts(allProducts);
    } catch (err) {
      toast({
        title: 'Error fetching products',
        description: 'Could not load products for the blockchain hub.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, user.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredProducts = useMemo(() => {
    if (filterStatus === 'all') return products;
    if (filterStatus === 'anchored') return products.filter(p => !!p.blockchainProof);
    if (filterStatus === 'not_anchored') return products.filter(p => !p.blockchainProof && p.verificationStatus === 'Verified');
    return products;
  }, [products, filterStatus]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trust & Verification Hub</h1>
        <p className="text-muted-foreground">
          Manage the on-chain lifecycle of Digital Product Passports, issuer trust, and advanced cryptographic proofs.
        </p>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>About Blockchain Management</CardTitle>
            <CardDescription>
                This hub provides tools to manage the on-chain representation of your products. Anchoring a product to the blockchain creates an immutable, timestamped record of its data, which can be independently verified. Manage Verifiable Credentials, track ownership via NFTs, and generate Zero-Knowledge Proofs for privacy-preserving compliance.
            </CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>Product Anchoring Status</CardTitle>
                <div className="flex items-center gap-2">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filter by status..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Products</SelectItem>
                            <SelectItem value="anchored">Anchored</SelectItem>
                            <SelectItem value="not_anchored">Ready to Anchor</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={fetchData} disabled={isLoading}>
                        <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
                        Refresh Data
                    </Button>
                </div>
            </div>
            <CardDescription>A list of all products and their current on-chain anchoring status.</CardDescription>
        </CardHeader>
        <CardContent>
        <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Anchored</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin"/></TableCell></TableRow>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                    <TableRow key={product.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                            <Image src={product.productImage} alt={product.productName} width={40} height={40} className="rounded-md" data-ai-hint="product photo"/>
                            {product.productName}
                        </TableCell>
                        <TableCell>
                            {product.blockchainProof ? <Badge variant="default"><ShieldCheck className="h-3 w-3 mr-1"/>Anchored</Badge> : <Badge variant="secondary"><Hourglass className="h-3 w-3 mr-1"/>Not Anchored</Badge>}
                        </TableCell>
                        <TableCell>
                            {product.blockchainProof ? formatDistanceToNow(new Date(product.blockchainProof.blockHeight ? new Date().getTime() : product.updatedAt), { addSuffix: true }) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                           <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/admin/blockchain/${product.id}`)}>
                             Manage
                           </Button>
                        </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">No products found for this filter.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
