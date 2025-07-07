// src/components/user-management-client.tsx
'use client';

import React, { useState, useTransition, useEffect, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import {
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Users,
  ArrowUpDown,
  ChevronDown,
  Upload,
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
  PaginationState,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
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
} from '@/components/ui/alert-dialog';

import type { User, Company } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { deleteUser } from '@/lib/actions/user-actions';
import { getUsers, getCompanies } from '@/lib/auth';
import UserForm from './user-form';
import UserImportDialog from './user-import-dialog';

interface UserManagementClientProps {
  user: User;
}

export default function UserManagementClient({
  user: adminUser,
}: UserManagementClientProps) {
  const [data, setData] = useState<{ users: User[]; pageCount: number }>({
    users: [],
    pageCount: 0,
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);
  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [debouncedFilter] = useDebounce(globalFilter, 500);

  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const pagination = React.useMemo(
    () => ({ pageIndex, pageSize }),
    [pageIndex, pageSize],
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // We only fetch companies once, but users are fetched on every change.
      if (companies.length === 0) {
        const companiesData = await getCompanies();
        setCompanies(companiesData);
      }
      const usersData = await getUsers({
        pageIndex,
        pageSize,
        query: debouncedFilter,
      });
      setData(usersData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load user data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, pageSize, debouncedFilter, toast, companies.length]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateNew = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleImport = () => setIsImportOpen(true);
  const handleImportSave = () => {
    toast({
      title: 'Import in Progress',
      description: 'New users will appear in the table shortly.',
    });
    setIsImportOpen(false);
    setTimeout(fetchData, 1000);
  };
  
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDelete = (userToDelete: User) => {
    startTransition(async () => {
      try {
        const success = await deleteUser(userToDelete.id, adminUser.id);
        if (success) {
          toast({
            title: 'User Deleted',
            description: `User "${userToDelete.fullName}" has been successfully deleted.`,
          });
          fetchData(); // Refetch data on success
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete user.',
          variant: 'destructive',
        });
      }
    });
  };

  const companyMap = React.useMemo(() => {
    return new Map(companies.map(c => [c.id, c.name]));
  }, [companies]);

  const columns: ColumnDef<User>[] = React.useMemo(
    () => [
      {
        accessorKey: 'fullName',
        header: 'User',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={row.original.avatarUrl} />
              <AvatarFallback>
                {row.original.fullName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{row.original.fullName}</span>
          </div>
        ),
      },
      { accessorKey: 'email', header: 'Email' },
      {
        accessorKey: 'roles',
        header: 'Role(s)',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.roles.map(role => (
              <Badge key={role} variant="outline">
                {role}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        accessorKey: 'companyId',
        header: 'Company',
        cell: ({ row }) => (
          <span>
            {companyMap.get(row.original.companyId) || row.original.companyId}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Created At
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => format(new Date(row.original.createdAt), 'PPP'),
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={isPending}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleEdit(user)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit User
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={e => e.preventDefault()}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete User
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete the user "{user.fullName}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(user)}
                          disabled={isPending}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [isPending, adminUser.id, companyMap, handleDelete, handleEdit],
  );

  const table = useReactTable({
    data: data.users,
    columns,
    pageCount: data.pageCount ?? -1,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    state: { sorting, pagination },
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View, create, and manage all users in the system.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleImport}>
                <Upload className="mr-2 h-4 w-4" /> Import Users
              </Button>
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" /> Invite User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center py-4">
            <Input
              placeholder="Filter by name or email..."
              value={globalFilter ?? ''}
              onChange={event => setGlobalFilter(event.target.value)}
              className="max-w-sm"
            />
          </div>
          {isLoading && data.users.length === 0 ? (
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
                          <Users className="h-12 w-12 text-muted-foreground" />
                          <h3 className="text-xl font-semibold">
                            No Users Found
                          </h3>
                          <p className="text-muted-foreground">
                            Invite the first user to get started.
                          </p>
                          <Button onClick={handleCreateNew}>Invite User</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="flex items-center justify-end space-x-2 py-4">
             <span className="text-sm text-muted-foreground">
                Page {table.getState().pagination.pageIndex + 1} of{' '}
                {table.getPageCount()}
            </span>
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
      <UserForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        user={selectedUser}
        adminUser={adminUser}
        onSave={fetchData}
        companies={companies}
      />
      <UserImportDialog
        isOpen={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSave={handleImportSave}
        user={adminUser}
      />
    </>
  );
}
