// src/components/blockchain-management-client.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  MoreHorizontal,
  Loader2,
  BookCopy,
  ArrowUpDown,
  Search,
  Filter,
  Fingerprint,
} from 'lucide-react';
import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import type { Product, User } from '@/types';
import { getProducts } from '@/lib/actions/product-actions';
import { useToast } from '@/hooks/use-toast';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BlockchainManagementClientProps {
  user: User;
}

const AnchorStatusBadge = ({ anchored }: { anchored: boolean }) => {
  return (
    <Badge variant={anchored ? 'default' : 'secondary'}>
      {anchored ? 'Anchored' : 'Not Anchored'}
    </Badge>
  );
};

export default function BlockchainManagementClient({
  user,
}: BlockchainManagementClientProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'lastUpdated', desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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

  const columns: ColumnDef<Product>[] = useMemo(
    () => [
      { accessorKey: 'productName', header: 'Product' },
      {
        accessorKey: 'supplier',
        header: 'Supplier',
      },
      {
        id: 'anchoringStatus',
        header: 'Anchoring Status',
        cell: ({ row }) => <AnchorStatusBadge anchored={!!row.original.blockchainProof} />,
        accessorFn: row => (row.blockchainProof ? 'Anchored' : 'Not Anchored'),
      },
      {
        id: 'lastUpdated',
        accessorKey: 'lastUpdated',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Last Updated
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => format(new Date(row.original.lastUpdated), 'PPP'),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/admin/blockchain/${row.original.id}`}>Manage</Link>
          </Button>
        ),
      },
    ],
    [],
  );
  
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
        const lowerCaseFilter = globalFilter.toLowerCase();
        const matchesSearch = 
            product.productName.toLowerCase().includes(lowerCaseFilter) ||
            product.supplier.toLowerCase().includes(lowerCaseFilter);
            
        const matchesStatus = 
            statusFilter === 'all' ||
            (statusFilter === 'anchored' && !!product.blockchainProof) ||
            (statusFilter === 'not_anchored' && !product.blockchainProof);
            
        return matchesSearch && matchesStatus;
    })
  }, [products, globalFilter, statusFilter]);

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
    <Card>
      <CardHeader>
        <CardTitle>Blockchain Management</CardTitle>
        <CardDescription>
          View the on-chain status and manage the trust settings for all products.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center py-4 gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={globalFilter}
                onChange={(event) =>
                  setGlobalFilter(event.target.value)
                }
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="anchored">Anchored</SelectItem>
                <SelectItem value="not_anchored">Not Anchored</SelectItem>
              </SelectContent>
            </Select>
          </div>
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="mx-auto my-16 h-8 w-8 animate-spin" />
          </div>
        ) : (
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
              {table.getRowModel().rows.map(row => (
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
              ))}
              {table.getRowModel().rows.length === 0 && (
                 <TableRow>
                  <TableCell colSpan={columns.length} className="h-48 text-center">
                    <Fingerprint className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-semibold">No Products Found</h3>
                    <p className="text-muted-foreground">
                        No products match your current filters.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
         <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
      </CardContent>
    </Card>
  );
}
