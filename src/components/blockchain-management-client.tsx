// src/components/blockchain-management-client.tsx
'use client';

import React, { useState, useEffect, useCallback, useTransition, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import {
  Loader2,
  Fingerprint,
  ChevronRight,
  RefreshCw,
  Rocket,
  Download,
  FileClock,
  ExternalLink,
} from 'lucide-react';

import type { Product, User } from '@/types';
import { getProducts, anchorProductOnChain, bulkAnchorProducts } from '@/lib/actions/product-actions';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { exportProducts } from '@/lib/actions/report-actions';
import { ScrollArea } from './ui/scroll-area';

interface BlockchainManagementClientProps {
  user: User;
}

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

export default function BlockchainManagementClient({ user }: BlockchainManagementClientProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMinting, startMintingTransition] = useTransition();
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const allProducts = await getProducts(user.id);
      setProducts(allProducts);
    } catch (err) {
      toast({
        title: 'Error fetching products',
        description: 'Could not load product information.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, user.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { readyToMint, anchored } = useMemo(() => {
    const readyToMint = products.filter(
      p => p.verificationStatus === 'Verified' && !p.blockchainProof,
    );
    const anchored = products.filter(p => !!p.blockchainProof);
    return { readyToMint, anchored };
  }, [products]);

  const handleMint = (productId: string) => {
    startMintingTransition(async () => {
        try {
            await anchorProductOnChain(productId, user.id);
            toast({ title: 'Minting process started...', description: 'The product will be anchored on-chain shortly.' });
            fetchData();
        } catch(error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });
  }

  const handleBulkMint = () => {
    const idsToMint = readyToMint.map(p => p.id);
    if (idsToMint.length === 0) return;
    startMintingTransition(async () => {
        try {
            await bulkAnchorProducts(idsToMint, user.id);
            toast({ title: 'Bulk Minting Started...', description: `${idsToMint.length} products will be anchored.` });
            fetchData();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });
  };

  const handleExport = async () => {
    try {
        const csv = await exportProducts('csv');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'minting_activity_log.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: 'Export Complete' });
    } catch (error) {
        toast({ title: 'Export Failed', variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Trust & Verification Hub</h1>
                <p className="text-muted-foreground">
                    Manage the on-chain lifecycle of your Digital Product Passports.
                </p>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={fetchData} disabled={isLoading}>
                    <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
                    Refresh Data
                </Button>
            </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Anchored" value={anchored.length} icon={Fingerprint} />
            <StatCard title="Ready to Mint" value={readyToMint.length} icon={Rocket} />
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Custodial Wallet</CardTitle>
                    <CardDescription>Platform-managed wallet for secure, gas-free transactions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Address</span>
                        <span className="font-mono text-xs">0x1234...abcd</span>
                    </div>
                     <div className="flex items-center justify-between text-sm mt-2">
                        <span className="text-muted-foreground">Balance (Amoy ETH)</span>
                        <span className="font-semibold">1.2345 ETH</span>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Minting Engine</CardTitle>
                    <CardDescription>Verified products ready to be anchored on-chain.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-72">
                        <div className="space-y-4">
                            {readyToMint.map(product => (
                                <div key={product.id} className="flex items-center justify-between p-2 rounded-md border">
                                    <div className="flex items-center gap-3">
                                        <Image src={product.productImage} alt={product.productName} width={40} height={40} className="rounded-md object-cover" data-ai-hint="product photo" />
                                        <div>
                                            <p className="font-semibold">{product.productName}</p>
                                            <p className="text-xs text-muted-foreground">{product.supplier}</p>
                                        </div>
                                    </div>
                                    <Button size="sm" onClick={() => handleMint(product.id)} disabled={isMinting}>
                                        {isMinting ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Mint'}
                                    </Button>
                                </div>
                            ))}
                            {readyToMint.length === 0 && (
                                <div className="text-center text-muted-foreground py-12">
                                    <p>No products are currently ready for minting.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={handleBulkMint} disabled={isMinting || readyToMint.length === 0}>
                         {isMinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Rocket className="mr-2 h-4 w-4" />}
                        Mint All Ready Products ({readyToMint.length})
                    </Button>
                </CardFooter>
            </Card>

            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>Minting Activity Log</CardTitle>
                    <CardDescription>History of all on-chain transactions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-72">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {anchored.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell>
                                        <p className="font-medium truncate">{p.productName}</p>
                                        <Link href={p.blockchainProof!.explorerUrl} target="_blank" className="text-xs text-primary hover:underline flex items-center gap-1">
                                            View TX <ExternalLink className="h-3 w-3" />
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Badge>Anchored</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {products.filter(p => p.isMinting).map(p => (
                                 <TableRow key={p.id}>
                                    <TableCell>{p.productName}</TableCell>
                                    <TableCell><Badge variant="secondary"><FileClock className="h-3 w-3 mr-1 animate-spin" /> Minting...</Badge></TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                         {anchored.length === 0 && products.filter(p => p.isMinting).length === 0 && (
                            <p className="text-center text-sm text-muted-foreground py-10">No minting activity yet.</p>
                        )}
                    </ScrollArea>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" className="w-full" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" /> Export Log
                    </Button>
                </CardFooter>
            </Card>
        </div>
    </div>
  );
}
