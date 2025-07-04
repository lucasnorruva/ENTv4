// src/components/service-ticket-management-client.tsx
'use client';

import React, { useState, useTransition, useEffect, useMemo, useCallback } from 'react';
import {
  MoreHorizontal,
  Plus,
  Loader2,
  Edit,
  Ticket,
  ArrowUpDown,
  ChevronDown,
  Check,
  RotateCcw,
  Factory,
  Box,
} from 'lucide-react';
import Link from 'next/link';
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
import { format } from 'date-fns';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

import type { ServiceTicket, User, Product, ProductionLine } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  getServiceTickets,
  updateServiceTicketStatus,
  getProducts,
  getProductionLines
} from '@/lib/actions';
import ServiceTicketForm from '@/components/service-ticket-form';
import { hasRole } from '@/lib/auth-utils';
import { UserRoles } from '@/lib/constants';

interface ServiceTicketManagementClientProps {
  user: User;
}

export default function ServiceTicketManagementClient({
  user,
}: ServiceTicketManagementClientProps) {
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productionLines, setProductionLines] = useState<ProductionLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    {},
  );
  const [globalFilter, setGlobalFilter] = useState('');

  const canManage =
    hasRole(user, UserRoles.ADMIN) || hasRole(user, UserRoles.SERVICE_PROVIDER) || hasRole(user, UserRoles.MANUFACTURER);
  
  const roleSlug = user.roles[0].toLowerCase().replace(/ /g, '-');


    const fetchInitialData = useCallback(async () => {
        setIsLoading(true);
        try {
          const [initialTickets, initialProducts, initialLines] = await Promise.all([
            getServiceTickets(user.id),
            getProducts(user.id),
            getProductionLines(),
          ]);
          setTickets(initialTickets);
          setProducts(initialProducts);
          setProductionLines(initialLines);
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to load initial data.',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      }, [toast, user.id]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleCreateNew = () => {
    setSelectedTicket(null);
    setIsFormOpen(true);
  };

  const handleEdit = (ticket: ServiceTicket) => {
    setSelectedTicket(ticket);
    setIsFormOpen(true);
  };

  const handleStatusUpdate = (
    ticketId: string,
    status: 'Open' | 'In Progress' | 'Closed',
  ) => {
    if (!user) return;
    startTransition(async () => {
      try {
        const updatedTicket = await updateServiceTicketStatus(
          ticketId,
          status,
          user.id,
        );
        setTickets(prev =>
          prev.map(t => (t.id === ticketId ? updatedTicket : t)),
        );
        toast({
          title: 'Status Updated',
          description: `Ticket status set to ${status}.`,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update ticket status.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleSave = () => {
    // Optimistically re-fetch after save
    getServiceTickets(user.id).then(setTickets);
    setIsFormOpen(false);
  };

  const productMap = useMemo(() => new Map(products.map(p => [p.id, p.productName])), [products]);
  const lineMap = useMemo(() => new Map(productionLines.map(l => [l.id, l.name])), [productionLines]);


  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Open':
        return 'destructive';
      case 'In Progress':
        return 'secondary';
      case 'Closed':
      default:
        return 'default';
    }
  };

  const columns: ColumnDef<ServiceTicket>[] = useMemo(
    () => [
      { accessorKey: "id", header: "Ticket ID", cell: ({row}) => <div className="font-mono text-xs">{row.getValue("id")}</div> },
      { accessorKey: "customerName", header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Requester <ArrowUpDown className="ml-2 h-4 w-4" /></Button> },
      {
        id: 'entity',
        header: 'Entity',
        cell: ({ row }) => {
            const ticket = row.original;
            if (ticket.productionLineId) {
                const lineName = lineMap.get(ticket.productionLineId) || 'Unknown Line';
                return <Link href={`/dashboard/${roleSlug}/lines/${ticket.productionLineId}`} className="flex items-center gap-2 hover:underline"><Factory className="h-4 w-4 text-muted-foreground" /> {lineName}</Link>
            }
            if (ticket.productId) {
                const productName = productMap.get(ticket.productId) || 'Unknown Product';
                return <Link href={`/dashboard/${roleSlug}/products/${ticket.productId}`} className="flex items-center gap-2 hover:underline"><Box className="h-4 w-4 text-muted-foreground" /> {productName}</Link>
            }
            return 'N/A';
        },
      },
      { accessorKey: "issue", header: "Issue", cell: ({row}) => <div className="truncate max-w-xs">{row.getValue("issue")}</div> },
      { accessorKey: "status", header: "Status", cell: ({row}) => <Badge variant={getStatusVariant(row.getValue("status"))}>{row.getValue("status")}</Badge> },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Created At <ArrowUpDown className="ml-2 h-4 w-4" /></Button>,
        cell: ({ row }) => format(new Date(row.getValue('createdAt')), 'PPP'),
      },
      ...(canManage
        ? [
            {
              id: 'actions',
              cell: ({ row }: { row: { original: ServiceTicket } }) => {
                const ticket = row.original;
                return (
                  <div className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isPending}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleEdit(ticket)}>
                          <Edit className="mr-2 h-4 w-4" />
                          View/Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleStatusUpdate(ticket.id, 'Open')}
                          disabled={ticket.status === 'Open'}
                        >
                           <RotateCcw className="mr-2 h-4 w-4" />
                          Mark as Open
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleStatusUpdate(ticket.id, 'In Progress')
                          }
                          disabled={ticket.status === 'In Progress'}
                        >
                          <Loader2 className="mr-2 h-4 w-4" />
                          Mark as In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusUpdate(ticket.id, 'Closed')}
                          disabled={ticket.status === 'Closed'}
                        >
                          <Check className="mr-2 h-4 w-4" /> Mark as Closed
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              },
            },
          ]
        : []),
    ],
    [isPending, productMap, lineMap, canManage, roleSlug],
  );

  const table = useReactTable({
    data: tickets,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    globalFilterFn: (row, columnId, filterValue) => {
        const search = filterValue.toLowerCase();
        
        const ticket = row.original;
        const requesterMatch = ticket.customerName.toLowerCase().includes(search);
        const issueMatch = ticket.issue.toLowerCase().includes(search);
  
        const entityName = ticket.productId
          ? productMap.get(ticket.productId)
          : ticket.productionLineId
          ? lineMap.get(ticket.productionLineId)
          : '';
        const entityMatch = entityName?.toLowerCase().includes(search) ?? false;
  
        return requesterMatch || issueMatch || entityMatch;
    },
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Service Tickets</CardTitle>
              <CardDescription>
                View and manage all active and past service tickets for
                products.
              </CardDescription>
            </div>
            {canManage && (
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" /> Create Ticket
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center py-4">
            <Input
              placeholder="Filter by requester, issue, or entity..."
              value={globalFilter}
              onChange={event => setGlobalFilter(event.target.value)}
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
                        onCheckedChange={value =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
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
                          <Ticket className="h-12 w-12 text-muted-foreground" />
                          <h3 className="text-xl font-semibold">
                            No Service Tickets
                          </h3>
                          <p className="text-muted-foreground">
                            Create the first service ticket to get started.
                          </p>
                          {canManage && (
                            <Button onClick={handleCreateNew}>
                              Create Ticket
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
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
      {canManage && (
        <ServiceTicketForm
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          ticket={selectedTicket}
          onSave={handleSave}
          user={user!}
          products={products}
          productionLines={productionLines}
        />
      )}
    </>
  );
}
