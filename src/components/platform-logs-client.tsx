// src/components/platform-logs-client.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  MoreHorizontal,
  ArrowUpDown,
  ChevronDown,
  BookCopy,
  Users,
  Building2,
  Webhook as WebhookIcon,
  KeyRound,
  FileQuestion,
  Wrench,
  Ticket,
  Shield,
  Cog,
  History,
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
import { format } from 'date-fns';

import type { AuditLog, Company, Product, User, Webhook } from '@/types';
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
import { Input } from './ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import {
  Card,
  CardContent,
} from './ui/card';

interface PlatformLogsClientProps {
  logs: AuditLog[];
  users: User[];
  products: Product[];
  companies: Company[];
  webhooks: Webhook[];
}

const entityIcons: Record<string, React.ElementType> = {
  pp: BookCopy,
  user: Users,
  comp: Building2,
  wh: WebhookIcon,
  key: KeyRound,
  cp: FileQuestion,
  serv: Wrench,
  spt: Ticket,
  tkt: Ticket,
  global: Shield,
  log: History,
  default: Cog,
};

const getEntityIcon = (entityId: string): React.ElementType => {
  const prefix = entityId.split('-')[0];
  return entityIcons[prefix] || entityIcons.default;
};

export default function PlatformLogsClient({
  logs,
  users,
  products,
  companies,
  webhooks,
}: PlatformLogsClientProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState('');

  const entityMaps = React.useMemo(
    () => ({
      users: new Map(users.map(u => [u.id, u.fullName])),
      products: new Map(products.map(p => [p.id, p.productName])),
      companies: new Map(companies.map(c => [c.id, c.name])),
      webhooks: new Map(webhooks.map(wh => [wh.id, wh.url])),
    }),
    [users, products, companies, webhooks],
  );

  const columns: ColumnDef<AuditLog>[] = React.useMemo(
    () => [
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Timestamp
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => format(new Date(row.original.createdAt), 'PPpp'),
        size: 250,
      },
      {
        accessorKey: 'userId',
        header: 'User',
        cell: ({ row }) => (
          <span>
            {entityMaps.users.get(row.original.userId) || row.original.userId}
          </span>
        ),
      },
      {
        accessorKey: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.action}</Badge>
        ),
      },
      {
        accessorKey: 'entityId',
        header: 'Entity',
        cell: ({ row }) => {
          const Icon = getEntityIcon(row.original.entityId);
          return (
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-xs">{row.original.entityId}</span>
            </div>
          );
        },
      },
      {
        id: 'details',
        header: 'Details',
        cell: ({ row }) => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="truncate text-xs text-muted-foreground max-w-[300px] inline-block">
                  {JSON.stringify(row.original.details)}
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-md bg-background text-foreground border shadow-lg">
                <pre className="text-xs p-2 overflow-auto">
                  {JSON.stringify(row.original.details, null, 2)}
                </pre>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
      },
    ],
    [entityMaps],
  );

  const table = useReactTable({
    data: logs,
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
    filterFns: {
      global: (row, columnId, filterValue) => {
        const search = filterValue.toLowerCase();
        
        const log = row.original;
        const user = entityMaps.users.get(log.userId) || log.userId;
        const action = log.action;
        const entity = log.entityId;

        return (
            user.toLowerCase().includes(search) ||
            action.toLowerCase().includes(search) ||
            entity.toLowerCase().includes(search)
        );
      },
    },
    globalFilterFn: 'global',
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center py-4">
          <Input
            placeholder="Filter logs by user, action, or entity ID..."
            value={globalFilter ?? ''}
            onChange={event => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
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
                    className="h-24 text-center"
                  >
                    No results.
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
      </CardContent>
    </Card>
  );
}
