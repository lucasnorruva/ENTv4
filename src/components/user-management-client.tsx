// src/components/user-management-client.tsx
'use client';

import React, {
  useState,
  useTransition,
  useMemo,
  useCallback,
  useEffect,
} from 'react';
import {
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Users,
  ArrowUpDown,
  ChevronDown,
  Upload,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
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
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Collections } from '@/lib/constants';

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
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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

import type { Company, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { deleteUser } from '@/lib/actions/user-actions';
import UserForm from './user-form';
import UserImportDialog from './user-import-dialog';
import RelativeTime from './relative-time';

interface UserManagementClientProps {
  adminUser: User;
  initialCompanies: Company[];
}

export default function UserManagementClient({
  adminUser,
  initialCompanies,
}: UserManagementClientProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setIsLoading(true);
    const q = collection(db, Collections.USERS);
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');

  const handleCreateNew = useCallback(() => {
    setSelectedUser(null);
    setIsFormOpen(true);
  }, []);

  const handleImport = useCallback(() => setIsImportOpen(true), []);

  const handleImportSave = useCallback(() => {
    toast({
      title: 'Import in Progress',
      description: 'New users will appear in the table shortly.',
    });
    setIsImportOpen(false);
    // Real-time listener will handle the update.
  }, [toast]);

  const handleEdit = useCallback((user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(
    (userToDelete: User) => {
      startTransition(async () => {
        try {
          await deleteUser(userToDelete.id, adminUser.id);
          toast({
            title: 'User Deleted',
            description: `User "${userToDelete.fullName}" has been successfully deleted.`,
          });
          // Real-time listener handles UI update
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to delete user.',
            variant: 'destructive',
          });
        }
      });
    },
    [adminUser.id, toast],
  );

  const handleSave = useCallback(() => {
    setIsFormOpen(false);
    // Real-time listener handles UI update
  }, []);

  const companyMap = useMemo(() => {
    return new Map(initialCompanies.map(c => [c.id, c.name]));
  }, [initialCompanies]);

  const columns: ColumnDef<User>[] = useMemo(
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
        cell: ({ row }) => <RelativeTime date={row.original.createdAt} />,
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
                  <DropdownMenuSeparator />
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
    [isPending, companyMap, handleEdit, handleDelete],
  );

  const table = useReactTable({
    data: users,
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
      const user = row.original;
      const companyName = companyMap.get(user.companyId)?.toLowerCase() || '';
      return (
        user.fullName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        companyName.includes(search)
      );
    },
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
              placeholder="Filter by name, email, or company..."
              value={globalFilter ?? ''}
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
          <div className="rounded-md border">
            {isLoading ? (
                <div className="h-96 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
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
            )}
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
      <UserForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        user={selectedUser}
        adminUser={adminUser}
        onSave={handleSave}
        companies={initialCompanies}
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
