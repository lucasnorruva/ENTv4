// src/components/blockchain-management-client.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import {
  Link as LinkIcon,
  Loader2,
  Fingerprint,
  Unlink,
  ShieldCheck,
  ShieldQuestion,
  Bot,
} from 'lucide-react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { Product, Company, User } from '@/types';
import { getProducts } from '@/lib/actions/product-actions';
import { getCompanies } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { generateZkProofForProduct } from '@/lib/actions/product-workflow-actions';
import CompanyForm from './company-form';

const AnchorStatusBadge = ({ anchored }: { anchored: boolean }) => {
  const Icon = anchored ? Fingerprint : Unlink;
  const variant = anchored ? 'default' : 'secondary';
  const text = anchored ? 'Anchored' : 'Not Anchored';
  const colorClass = anchored
    ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700'
    : '';

  return (
    <Badge variant={variant} className={cn('capitalize', colorClass)}>
      <Icon className="mr-1 h-3.5 w-3.5" />
      {text}
    </Badge>
  );
};

interface BlockchainManagementClientProps {
    user: User;
}

export default function BlockchainManagementClient({ user }: BlockchainManagementClientProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use a user ID with admin privileges to fetch all data
      const [allProducts, allCompanies] = await Promise.all([
        getProducts(user.id),
        getCompanies(),
      ]);
      setProducts(allProducts);
      setCompanies(allCompanies);
    } catch (err) {
      toast({
        title: 'Error fetching data',
        description: 'Could not load blockchain-related information.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, user.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerateProof = (productId: string) => {
    startTransition(async () => {
      try {
        const updatedProduct = await generateZkProofForProduct(productId, user.id);
        setProducts(prev =>
          prev.map(p => (p.id === productId ? updatedProduct : p)),
        );
        toast({
          title: 'ZK Proof Generated',
          description: 'A mock Zero-Knowledge Proof for compliance has been created.',
        });
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to generate Zero-Knowledge Proof.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setIsFormOpen(true);
  };
  
  const handleSaveCompany = (savedCompany: Company) => {
    setCompanies(prev => prev.map(c => c.id === savedCompany.id ? savedCompany : c));
    setIsFormOpen(false);
  }

  // Define columns for different tables
  const dppColumns: ColumnDef<Product>[] = useMemo(
    () => [
      { accessorKey: 'productName', header: 'Product Name' },
      {
        id: 'anchoringStatus',
        header: 'Anchoring Status',
        cell: ({ row }) => <AnchorStatusBadge anchored={!!row.original.blockchainProof} />,
      },
      { id: 'vcStatus', header: 'VC Status', cell: ({ row }) => row.original.verifiableCredential ? <Badge>Issued</Badge> : <Badge variant="outline">Not Issued</Badge>},
      { id: 'zkProofStatus', header: 'ZK Proof', cell: ({ row }) => row.original.zkProof ? <Badge variant="secondary">Generated</Badge> : <Badge variant="outline">None</Badge>},
      { id: 'txHash', header: 'Transaction Hash', cell: ({ row }) => row.original.blockchainProof ? <a href={row.original.blockchainProof.explorerUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-xs hover:underline">{row.original.blockchainProof.txHash.substring(0,12)}...</a> : 'N/A' },
      { id: 'actions', cell: ({ row }) => <Button asChild variant="outline" size="sm"><Link href={`/dashboard/admin/products/${row.original.id}`}>Manage</Link></Button> },
    ],
    [],
  );

  const issuerColumns: ColumnDef<Company>[] = useMemo(
    () => [
      { accessorKey: 'name', header: 'Company' },
      { accessorKey: 'industry', header: 'Industry' },
      { id: 'isTrustedIssuer', header: 'Trusted Issuer (EBSI)', cell: ({ row }) => row.original.isTrustedIssuer ? <ShieldCheck className="h-5 w-5 text-green-500" /> : <ShieldQuestion className="h-5 w-5 text-muted-foreground"/> },
      { id: 'revocationListUrl', header: 'Revocation List URL', cell: ({ row }) => row.original.revocationListUrl ? <a href={row.original.revocationListUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-xs hover:underline">{row.original.revocationListUrl}</a> : 'Not Set' },
      { id: 'actions', cell: ({ row }) => <Button variant="outline" size="sm" onClick={() => handleEditCompany(row.original)}>Edit</Button> },
    ],
    [],
  );

  const zkpColumns: ColumnDef<Product>[] = useMemo(
    () => [
      { accessorKey: 'productName', header: 'Product Name' },
      { id: 'zkProofStatus', header: 'ZK Proof Status', cell: ({ row }) => row.original.zkProof ? <Badge variant="secondary">Generated</Badge> : <Badge variant="outline">Not Generated</Badge> },
      { id: 'actions', cell: ({ row }) => <Button variant="outline" size="sm" onClick={() => handleGenerateProof(row.original.id)} disabled={isPending}>{isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Bot className="mr-2 h-4 w-4"/>} Generate Proof</Button> },
    ],
    [isPending],
  );

  const dppTable = useReactTable({ data: products, columns: dppColumns, getCoreRowModel: getCoreRowModel() });
  const issuerTable = useReactTable({ data: companies, columns: issuerColumns, getCoreRowModel: getCoreRowModel() });
  const zkpTable = useReactTable({ data: products.filter(p => p.verificationStatus === 'Verified'), columns: zkpColumns, getCoreRowModel: getCoreRowModel() });


  return (
    <>
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        Blockchain & Trust Management
      </h1>
      <Tabs defaultValue="dpp">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dpp">DPP Anchoring</TabsTrigger>
          <TabsTrigger value="issuers">Issuers & Revocation</TabsTrigger>
          <TabsTrigger value="zkp">Zero-Knowledge Proofs</TabsTrigger>
        </TabsList>
        <TabsContent value="dpp">
          <Card>
            <CardHeader>
              <CardTitle>Digital Product Passports</CardTitle>
              <CardDescription>
                View the on-chain and verifiable credential status of all products.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="mx-auto my-16 h-8 w-8 animate-spin" />
              ) : (
                <Table>
                  <TableHeader>
                    {dppTable.getHeaderGroups().map(headerGroup => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {dppTable.getRowModel().rows.map(row => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map(cell => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="issuers">
          <Card>
            <CardHeader>
              <CardTitle>Trusted Issuers & Revocation</CardTitle>
              <CardDescription>
                Manage companies that are verified issuers and their credential revocation lists.
              </CardDescription>
            </CardHeader>
            <CardContent>
               {isLoading ? (
                <Loader2 className="mx-auto my-16 h-8 w-8 animate-spin" />
              ) : (
                <Table>
                  <TableHeader>
                    {issuerTable.getHeaderGroups().map(headerGroup => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {issuerTable.getRowModel().rows.map(row => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map(cell => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="zkp">
           <Card>
            <CardHeader>
              <CardTitle>Zero-Knowledge Proofs</CardTitle>
              <CardDescription>
                Generate ZKPs for verified products to attest to compliance privately.
              </CardDescription>
            </CardHeader>
            <CardContent>
               {isLoading ? (
                <Loader2 className="mx-auto my-16 h-8 w-8 animate-spin" />
              ) : (
                <Table>
                  <TableHeader>
                    {zkpTable.getHeaderGroups().map(headerGroup => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {zkpTable.getRowModel().rows.map(row => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map(cell => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    <CompanyForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        company={selectedCompany}
        adminUser={user}
        onSave={handleSaveCompany}
    />
    </>
  );
}
