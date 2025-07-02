// src/components/compliance-path-management.tsx
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Loader2,
  ListTree,
} from 'lucide-react';

import type { CompliancePath, User } from '@/types';
import { UserRoles } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { deleteCompliancePath, getCompliancePaths } from '@/lib/actions';
import { hasRole } from '@/lib/auth-utils';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import CompliancePathForm from './compliance-path-form';

interface CompliancePathManagementProps {
  user: User;
}

export default function CompliancePathManagement({
  user,
}: CompliancePathManagementProps) {
  const [paths, setPaths] = useState<CompliancePath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState<CompliancePath | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    async function fetchPaths() {
      try {
        const data = await getCompliancePaths();
        setPaths(data);
      } catch (e) {
        toast({
          title: 'Error',
          description: 'Failed to load compliance paths.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchPaths();
  }, [toast, isPending]);

  const handleCreateNew = () => {
    setSelectedPath(null);
    setIsFormOpen(true);
  };

  const handleEdit = (path: CompliancePath) => {
    setSelectedPath(path);
    setIsFormOpen(true);
  };

  const handleDelete = (pathId: string) => {
    startTransition(async () => {
      try {
        await deleteCompliancePath(pathId, user.id);
        toast({ title: 'Compliance Path Deleted' });
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete compliance path.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleSave = (savedPath: CompliancePath) => {
    setIsFormOpen(false);
  };

  const canManage =
    hasRole(user, UserRoles.ADMIN) ||
    hasRole(user, UserRoles.COMPLIANCE_MANAGER) ||
    hasRole(user, UserRoles.AUDITOR);

  const canDelete =
    hasRole(user, UserRoles.ADMIN) ||
    hasRole(user, UserRoles.COMPLIANCE_MANAGER);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Compliance Path Management</CardTitle>
              <CardDescription>
                Manage the compliance standards and rule sets for products.
              </CardDescription>
            </div>
            {canManage && (
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" /> Create Path
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Path Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Regulations</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paths.map(path => (
                  <TableRow key={path.id}>
                    <TableCell className="font-medium">
                      {path.name}
                      <p className="text-xs text-muted-foreground font-normal line-clamp-1">
                        {path.description}
                      </p>
                    </TableCell>
                    <TableCell>{path.category}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {path.regulations.map(reg => (
                          <Badge key={reg} variant="secondary">
                            {reg}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleEdit(path)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {canDelete && (
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
                                    <AlertDialogTitle>
                                      Are you sure?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete the
                                      compliance path "{path.name}".
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(path.id)}
                                      disabled={isPending}
                                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {paths.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <ListTree className="h-12 w-12 text-muted-foreground" />
                        <h3 className="text-xl font-semibold">
                          No Compliance Paths
                        </h3>
                        <p className="text-muted-foreground">
                          Create a path to define compliance rules for products.
                        </p>
                        {canManage && (
                          <Button onClick={handleCreateNew}>
                            <Plus className="mr-2 h-4 w-4" /> Create Path
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {canManage && (
        <CompliancePathForm
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          path={selectedPath}
          onSave={handleSave}
          user={user}
        />
      )}
    </>
  );
}
