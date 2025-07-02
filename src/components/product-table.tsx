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
  FileQuestion,
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
import { usePathname, useSearchParams } from "next/navigation";

import type { Product, User, CompliancePath } from "@/types";
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
} from "@/components/ui/alert-dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface ProductTableProps {
  products: Product[];
  user: User;
  compliancePaths: CompliancePath[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onSubmitForReview: (id: string) => void;
  onRecalculateScore: (id: string, productName: string) => void;
}

export default function ProductTable({
  products,
  user,
  compliancePaths,
  onEdit,
  onDelete,
  onSubmitForReview,
  onRecalculateScore,
}: ProductTableProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'lastUpdated', desc: true },
  ]);
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const canEdit =
    user.roles.includes(UserRoles.ADMIN) ||
    user.roles.includes(UserRoles.SUPPLIER);

  const basePath = pathname.split('/').slice(0, 3).join('/');

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

  const pathMap = React.useMemo(() => new Map(compliancePaths.map(p => [p.id, p.name])), [compliancePaths]);

  const columns: ColumnDef<Product>[] = React.useMemo(
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
        cell: ({ row }) => {
          const warnings = row.original.dataQualityWarnings;

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
                href={`${basePath}/products/${row.original.id}`}
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
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
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
        accessorKey: "sustainability.score",
        id: "esgScore",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            ESG Score
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const score = row.original.sustainability?.score;
          return (
            <div className="text-center font-medium">
              {score !== undefined ? score : "N/A"}
            </div>
          );
        },
      },
      {
        accessorKey: 'compliancePathId',
        header: 'Compliance Path',
        cell: ({ row }) => {
          const pathId = row.original.compliancePathId;
          const pathName = pathId ? pathMap.get(pathId) : 'N/A';
          return pathName !== 'N/A' ? (
             <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline">{pathName}</Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{pathName}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="text-muted-foreground text-xs italic">N/A</span>
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
        cell: ({ row }) => format(new Date(row.original.lastUpdated), 'PPP'),
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const product = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {canEdit && (
                  <DropdownMenuItem onClick={() => onEdit(product)}>
                    <FilePenLine className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href={`/products/${product.id}`} target="_blank">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Public Passport
                  </Link>
                </DropdownMenuItem>
                {canEdit && (
                  <>
                    <DropdownMenuItem
                      onClick={() =>
                        onRecalculateScore(product.id, product.productName)
                      }
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Recalculate AI Data
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
    [onEdit, onDelete, onRecalculateScore, onSubmitForReview, canEdit, basePath, pathMap],
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
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  React.useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      table.getColumn('productName')?.setFilterValue(query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, table.getColumn('productName')]);

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="Filter products by name..."
          value={
            (table.getColumn('productName')?.getFilterValue() as string) ?? ''
          }
          onChange={event =>
            table.getColumn('productName')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Select
          value={
            (table.getColumn('status')?.getFilterValue() as string) ?? ''
          }
          onValueChange={value =>
            table.getColumn('status')?.setFilterValue(value === 'All' ? '' : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="Published">Published</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={
            (table.getColumn('verificationStatus')?.getFilterValue() as string) ?? ''
          }
          onValueChange={value =>
            table.getColumn('verificationStatus')?.setFilterValue(value === 'All' ? '' : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Verification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Verifications</SelectItem>
            <SelectItem value="Verified">Verified</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Failed">Failed</SelectItem>
            <SelectItem value="Not Submitted">Not Submitted</SelectItem>
          </SelectContent>
        </Select>

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
                let colName = column.id;
                if (colName === 'esgScore') colName = 'ESG Score';
                if (colName === 'productName') colName = 'Product';
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={value => column.toggleVisibility(!!value)}
                  >
                    {colName.replace(/([A-Z])/g, ' $1')}
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
                    <BookCopy className="h-12 w-12 text-muted-foreground" />
                    <h3 className="text-xl font-semibold">No Products Yet</h3>
                    <p className="text-muted-foreground">
                      Get started by creating your first product passport.
                    </p>
                    {canEdit && (
                      <Button onClick={() => onEdit(null as any)}>
                        Create New Passport
                      </Button>
                    )}
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
    </div>
  );
}
