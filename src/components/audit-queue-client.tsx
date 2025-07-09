// src/components/audit-queue-client.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
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
import { ArrowUpDown, ChevronDown, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import type { Product, User } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AuditReviewDialog } from '@/components/audit-review-dialog';

interface AuditQueueClientProps {
  user: User;
  initialProducts: Product[];
}

export function AuditQueueClient({ user, initialProducts }: AuditQueueClientProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'updatedAt', desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    {},
  );

  const handleReviewClick = useCallback((product: Product) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  }, []);

  const columns: ColumnDef<Product>[] = useMemo(
    () => [
      {
        accessorKey: 'productName',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Product
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Image
              src={row.original.productImage}
              alt={row.original.productName}
              width={40}
              height={40}
              className="rounded-md object-cover"
              data-ai-hint="product photo"
            />
            <Link
              href={`/dashboard/auditor/products/${row.original.id}`}
              className="font-medium hover:underline"
              target="_blank"
            >
              {row.original.productName}
            </Link>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
      },
      {
        accessorKey: 'supplier',
        header: 'Supplier',
      },
      {
        accessorKey: 'updatedAt',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Submitted
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => format(new Date(row.original.updatedAt), 'PPP'),
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReviewClick(product)}
              >
                Review Product
              </Button>
            </div>
          );
        },
      },
    ],
    [handleReviewClick],
  );

  const table = useReactTable({
    data: initialProducts,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  return (
    <>
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="Filter by product name..."
          value={
            (table.getColumn('productName')?.getFilterValue() as string) ?? ''
          }
          onChange={event =>
            table.getColumn('productName')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter(column => column.getCanHide())
              .map(column => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={value => column.toggleVisibility(!!value)}
                  >
                    {column.id.replace(/([A-Z])/g, ' $1')}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
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
                <TableCell
                  colSpan={columns.length}
                  className="h-48 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-4">
                    <ShieldCheck className="h-12 w-12 text-muted-foreground" />
                    <h3 className="text-xl font-semibold">
                      Audit Queue is Clear
                    </h3>
                    <p className="text-muted-foreground">
                      No products are currently awaiting verification. Great
                      job!
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
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

      <AuditReviewDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        product={selectedProduct}
        user={user}
      />
    </>
  );
}
