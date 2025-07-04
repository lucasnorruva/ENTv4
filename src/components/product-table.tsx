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
  AlertCircle,
  BookCopy,
  ExternalLink,
  Loader2,
  Archive,
  Globe,
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
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "./ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { UserRoles } from "@/lib/constants";
import { Checkbox } from "./ui/checkbox";
import { can } from "@/lib/permissions";
import { useRouter } from "next/navigation";

interface ProductTableProps {
  products: Product[];
  user: User;
  isLoading: boolean;
  onDelete: (id: string) => void;
  onSubmitForReview: (id: string) => void;
  onRecalculateScore: (id: string, productName: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkSubmit: (ids: string[]) => void;
  onBulkArchive: (ids: string[]) => void;
  initialFilter?: string;
}

export default function ProductTable({
  products,
  user,
  isLoading,
  onDelete,
  onSubmitForReview,
  onRecalculateScore,
  onBulkDelete,
  onBulkSubmit,
  onBulkArchive,
  initialFilter,
}: ProductTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState(initialFilter ?? '');
  const router = useRouter();

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

  const getVerificationVariant = (status?: Product['verificationStatus']) => {
    switch (status) {
      case 'Verified':
        return 'default';
      case 'Pending':
        return 'secondary';
      case 'Failed':
        return 'destructive';
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
          const warnings = row.original.dataQualityWarnings;
          const isProcessing = row.original.isProcessing;

          return (
            <div className="flex items-center gap-3">
              {isProcessing && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>AI processing is in progress.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
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
              {warnings && warnings.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-bold">Data Quality Warnings:</p>
                      <ul className="list-disc list-inside">
                        {warnings.map((w, i) => (
                          <li key={i}>{w.warning}</li>
                        ))}
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          );
        },
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
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={getStatusVariant(row.original.status)}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: 'verificationStatus',
        header: 'Verification',
        cell: ({ row }) => (
          <Badge
            variant={getVerificationVariant(row.original.verificationStatus)}
          >
            {row.original.verificationStatus ?? 'Not Submitted'}
          </Badge>
        ),
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
        cell: ({ row }) => format(new Date(row.original.lastUpdated), 'PPP'),
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
                  disabled={product.isProcessing}
                >
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/dashboard/${roleSlug}/products/${product.id}`}
                  >
                    <FilePenLine className="mr-2 h-4 w-4" />
                    View / Edit
                  </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem
                  onClick={() => router.push(`/dashboard/admin/global-tracker?productId=${product.id}`)}
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Track on Globe
                </DropdownMenuItem>
                {can(user, "product:recalculate", product) && (
                  <>
                    <DropdownMenuItem
                      onClick={() =>
                        onRecalculateScore(product.id, product.productName)
                      }
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Recalculate AI Score
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onSubmitForReview(product.id)}
                      disabled={
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
                          disabled={!can(user, 'product:delete', product)}
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
    [onDelete, onRecalculateScore, onSubmitForReview, user, roleSlug],
  );

  const table = useReactTable({
    data: products,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const search = filterValue.toLowerCase();
      const productName = row.original.productName?.toLowerCase() ?? '';
      const gtin = row.original.gtin?.toLowerCase() ?? '';
      const supplier = row.original.supplier?.toLowerCase() ?? '';
      return (
        productName.includes(search) ||
        gtin.includes(search) ||
        supplier.includes(search)
      );
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
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

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <div className="flex flex-1 items-center gap-2">
          {selectedRowCount > 0 ? (
            <p className="text-sm text-muted-foreground">
              {selectedRowCount} of {table.getFilteredRowModel().rows.length}{" "}
              row(s) selected.
            </p>
          ) : (
            <Input
              placeholder="Filter by name, GTIN, or supplier..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="max-w-sm"
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedRowCount > 0 ? (
            <>
              {canBulkSubmit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onBulkSubmit(
                      table.getFilteredSelectedRowModel().rows.map(r => r.original.id),
                    )
                  }
                >
                  <Send className="mr-2 h-4 w-4" />
                  Submit ({selectedRowCount})
                </Button>
              )}
              {canBulkArchive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onBulkArchive(
                      table.getFilteredSelectedRowModel().rows.map(r => r.original.id),
                    )
                  }
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive ({selectedRowCount})
                </Button>
              )}
              {canBulkDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    onBulkDelete(
                      table.getFilteredSelectedRowModel().rows.map(r => r.original.id),
                    )
                  }
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete ({selectedRowCount})
                </Button>
              )}
            </>
          ) : (
            <>
              <Select
                value={
                  (table.getColumn("status")?.getFilterValue() as string) ??
                  "all"
                }
                onValueChange={(value) =>
                  table
                    .getColumn("status")
                    ?.setFilterValue(value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={
                  (table
                    .getColumn("verificationStatus")
                    ?.getFilterValue() as string) ?? "all"
                }
                onValueChange={(value) =>
                  table
                    .getColumn("verificationStatus")
                    ?.setFilterValue(value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by verification..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Verification</SelectItem>
                  <SelectItem value="Verified">Verified</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                  <SelectItem value="Not Submitted">Not Submitted</SelectItem>
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
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
            </>
          )}
        </div>
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
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-48 text-center"
                >
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
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
                  className="h-24 text-center"
                >
                  <BookCopy className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-lg font-semibold">
                    No Products Found
                  </h3>
                  <p className="text-muted-foreground">
                    No results for the current filter.
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
