
// src/components/product-table.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MoreHorizontal,
  FilePenLine,
  Trash2,
  Send,
  RefreshCw,
  ArrowUpDown,
  ChevronDown,
  BookCopy,
  Archive,
  ListFilter,
  CheckCircle,
  AlertTriangle,
  Loader2 as Loader2Icon,
} from "lucide-react";
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
} from "@tanstack/react-table";
import { format } from "date-fns";

import type { Product, User } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "./ui/checkbox";
import { can } from "@/lib/permissions";
import { getStatusBadgeClasses, getStatusBadgeVariant } from "@/lib/dpp-display-utils";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { Tooltip, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import RelativeTime from "./relative-time";

interface ProductTableProps {
  products: Product[];
  user: User;
  isProcessingAction: boolean;
  onDelete: (id: string) => void;
  onSubmitForReview: (id: string) => void;
  onRecalculateScore: (id: string, productName: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkSubmit: (ids: string[]) => void;
  onBulkArchive: (ids: string[]) => void;
}

export default function ProductTable({
  products,
  user,
  isProcessingAction,
  onDelete,
  onSubmitForReview,
  onRecalculateScore,
  onBulkDelete,
  onBulkSubmit,
  onBulkArchive,
}: ProductTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "lastUpdated", desc: true },
  ]);
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const roleSlug = user.roles[0].toLowerCase().replace(/ /g, '-');

  const getStatusVariant = (status: Product['status']) => {
    switch (status) {
      case 'Published':
        return 'default';
      case 'Draft':
        return 'secondary';
      case 'Archived':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const columns: ColumnDef<Product>[] = React.useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
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
        cell: ({ row }) => {
          return (
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
                href={`/dashboard/${roleSlug}/products/${row.original.id}`}
                className="font-medium hover:underline"
              >
                {row.original.productName}
              </Link>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
            row.original.isMinting ? (
                <Badge variant="secondary">
                    <Loader2Icon className="mr-1 h-3 w-3 animate-spin"/> Minting...
                </Badge>
            ) : (
                <Badge variant={getStatusVariant(row.original.status)}>
                    {row.original.status}
                </Badge>
            )
        ),
      },
      {
        accessorKey: 'verificationStatus',
        header: 'Verification',
        cell: ({ row }) => (
          <Badge
            variant={getStatusBadgeVariant(row.original.verificationStatus)}
            className={cn('capitalize', getStatusBadgeClasses(row.original.verificationStatus))}
          >
            {row.original.verificationStatus ?? 'Not Submitted'}
          </Badge>
        ),
      },
      {
        id: 'dataQuality',
        header: 'Data Quality',
        accessorFn: (row) => row.dataQualityWarnings?.length || 0,
        cell: ({ row }) => {
          const warnings = row.original.dataQualityWarnings;
          const warningCount = warnings?.length || 0;
          if (warningCount === 0) {
            return (
              <Badge variant="outline" className="border-green-300 dark:border-green-700">
                <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
                Pass
              </Badge>
            );
          }
          return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700">
                            <AlertTriangle className="mr-1 h-3 w-3 text-amber-500" />
                            {warningCount} Warning(s)
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <ul className="list-disc list-inside text-xs">
                           {warnings?.slice(0, 3).map((w,i) => <li key={i}>{w.field}: {w.warning}</li>)}
                           {warnings && warnings.length > 3 && <li>...and more</li>}
                        </ul>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
          );
        },
      },
      {
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
        cell: ({ row }) => <RelativeTime date={row.original.lastUpdated} />,
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const product = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isProcessingAction}
                >
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/dashboard/${roleSlug}/products/${product.id}/edit`}
                  >
                    <FilePenLine className="mr-2 h-4 w-4" />
                    View / Edit
                  </Link>
                </DropdownMenuItem>
                {can(user, "product:recalculate", product) && (
                  <>
                    <DropdownMenuItem
                      onClick={() =>
                        onRecalculateScore(product.id, product.productName)
                      }
                      disabled={isProcessingAction}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Recalculate AI Score
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onSubmitForReview(product.id)}
                      disabled={
                        isProcessingAction ||
                        product.verificationStatus === 'Pending' ||
                        product.verificationStatus === 'Verified'
                      }
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Submit for Review
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          onSelect={e => e.preventDefault()}
                          className="text-destructive"
                          disabled={isProcessingAction || !can(user, 'product:delete', product)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete the passport for "{product.productName}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(product.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onDelete, onRecalculateScore, onSubmitForReview, user, roleSlug, isProcessingAction],
  );

  const table = useReactTable({
    data: products,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    globalFilterFn: (row, columnId, filterValue) => {
        const search = filterValue.toLowerCase();
        return (
          row.original.productName.toLowerCase().includes(search) ||
          row.original.supplier.toLowerCase().includes(search) ||
          (row.original.gtin || '').toLowerCase().includes(search)
        );
      },
  });

  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length;
  const canBulkDelete =
    can(user, 'product:delete') &&
    table.getFilteredSelectedRowModel().rows.every(row => can(user, 'product:delete', row.original));

  const canBulkSubmit =
    can(user, 'product:submit') &&
    table.getFilteredSelectedRowModel().rows.every(row => can(user, 'product:submit', row.original));

  const canBulkArchive =
    can(user, 'product:archive') &&
    table.getFilteredSelectedRowModel().rows.every(row => can(user, 'product:archive', row.original));

  const dataQualityFilter = table.getColumn('dataQuality')?.getFilterValue() as string | undefined;


  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4 gap-2 flex-wrap">
        <Input
          placeholder="Filter by name, GTIN, or supplier..."
          value={globalFilter ?? ''}
          onChange={(event) =>
            setGlobalFilter(event.target.value)
          }
          className="max-w-sm"
        />

        <div className="flex items-center gap-2 ml-auto">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                        <ListFilter className="mr-2 h-4 w-4" />
                        Data Quality
                        {dataQualityFilter === 'warnings' && <span className="ml-2 rounded-full bg-destructive w-2 h-2"></span>}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Filter Data Quality</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={dataQualityFilter} onValueChange={(value) => table.getColumn('dataQuality')?.setFilterValue(value === 'all' ? undefined : value)}>
                        <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="warnings">Has Warnings</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                    return (
                    <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                        }
                    >
                        {column.id.replace(/([A-Z])/g, " $1")}
                    </DropdownMenuCheckboxItem>
                    );
                })}
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
      {selectedRowCount > 0 && (
         <div className="flex-1 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-2">
                <span>{selectedRowCount} row(s) selected.</span>
                {canBulkSubmit && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Send className="mr-2 h-4 w-4" />
                      Submit ({selectedRowCount})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Submit for Review?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will submit {selectedRowCount} product(s) to the audit queue for verification.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onBulkSubmit(table.getFilteredSelectedRowModel().rows.map(r => r.original.id))}>
                        Submit
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {canBulkArchive && (
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Archive className="mr-2 h-4 w-4" />
                      Archive ({selectedRowCount})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Archive Products?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will archive {selectedRowCount} product(s). They will be hidden from most views but not deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onBulkArchive(table.getFilteredSelectedRowModel().rows.map(r => r.original.id))}>
                        Archive
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {canBulkDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete ({selectedRowCount})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete {selectedRowCount} product(s). This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        onClick={() => onBulkDelete(table.getFilteredSelectedRowModel().rows.map(r => r.original.id))}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              </div>
        </div>
      )}
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
                  className={cn(
                      row.original.verificationStatus === 'Failed' && 'bg-destructive/5',
                      row.original.verificationStatus === 'Pending' && 'bg-amber-400/5'
                  )}
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
                   <BookCopy className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-semibold">
                      No Products Found
                    </h3>
                    <p className="text-muted-foreground">
                      No products match the current filters.
                    </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
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
    </div>
  );
}
