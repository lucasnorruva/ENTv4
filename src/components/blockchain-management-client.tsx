// src/components/blockchain-management-client.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertCircle,
  Link as LinkIcon,
  ExternalLink,
  Loader2,
  Fingerprint,
  Unlink,
} from 'lucide-react';
import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { Product } from '@/types';
import { getProducts } from '@/lib/actions/product-actions';
import { useToast } from '@/hooks/use-toast';

const AnchorStatusBadge = ({ anchored }: { anchored: boolean }) => {
  const Icon = anchored ? Fingerprint : Unlink;
  const variant = anchored ? 'default' : 'secondary';
  const text = anchored ? 'Anchored' : 'Not Anchored';
  const colorClass = anchored
    ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700'
    : '';

  return (
    <Badge variant={variant} className={colorClass}>
      <Icon className="mr-1 h-3.5 w-3.5" />
      {text}
    </Badge>
  );
};

export default function BlockchainManagementClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'id', desc: false },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use a user ID with admin privileges to fetch all products
      const allProducts = await getProducts('user-admin');
      setProducts(allProducts);
    } catch (err) {
      toast({
        title: 'Error fetching data',
        description: 'Could not load product information.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredProducts = useMemo(() => {
    if (filter === 'all') return products;
    if (filter === 'anchored')
      return products.filter(p => !!p.blockchainProof);
    if (filter === 'not_anchored')
      return products.filter(p => !p.blockchainProof);
    return products;
  }, [products, filter]);

  const columns: ColumnDef<Product>[] = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('id')}</span>,
      },
      {
        accessorKey: 'productName',
        header: 'Product Name',
      },
      {
        id: 'anchoringStatus',
        header: 'Anchoring Status',
        cell: ({ row }) => <AnchorStatusBadge anchored={!!row.original.blockchainProof} />,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/admin/products/${row.original.id}`}>
              Manage
            </Link>
          </Button>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: filteredProducts,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        Blockchain Management
      </h1>
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>About Blockchain Management</AlertTitle>
        <AlertDescription>
          <p className="mb-2">
            This page provides tools to manage on-chain aspects of your Digital Product Passports (DPPs). You can simulate:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>Anchoring DPPs:</strong> Recording DPP data hashes and key identifiers on a mock blockchain.</li>
            <li><strong>Updating Chain of Custody:</strong> Documenting product transfers and lifecycle events.</li>
            <li><strong>Transferring Ownership:</strong> Modifying DPP ownership records.</li>
            <li><strong>Managing Verifiable Credentials:</strong> Viewing and retrieving product-related VCs.</li>
            <li><strong>DPP Token Operations:</strong> Conceptual minting, metadata updates, and status checks for DPP tokens.</li>
            <li><strong>Smart Contract Actions:</strong> Conceptual interactions for on-chain status updates and event logging.</li>
            <li><strong>Authenticity & Ownership:</strong> Issuing conceptual VCs for authenticity and linking NFTs for ownership.</li>
          </ul>
          <p className="mt-2">
            These operations interact with mock API endpoints. For technical details, refer to the{' '}
            <a href="/docs/api" className="font-semibold text-primary hover:underline">
              OpenAPI Specification <ExternalLink className="inline-block h-3 w-3" />
            </a>
            .
          </p>
        </AlertDescription>
      </Alert>
      <Card>
        <CardHeader>
          <CardTitle>Digital Product Passports</CardTitle>
          <CardDescription>
            View and manage blockchain-related aspects of DPPs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label htmlFor="filter-status" className="text-sm font-medium mr-2">Filter by Anchoring Status</label>
            <Select onValueChange={setFilter} defaultValue="all">
              <SelectTrigger id="filter-status" className="w-[200px]">
                <SelectValue placeholder="Filter..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All DPPs</SelectItem>
                <SelectItem value="anchored">Anchored</SelectItem>
                <SelectItem value="not_anchored">Not Anchored</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No products found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}