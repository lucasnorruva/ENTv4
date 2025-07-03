// src/components/compliance-path-management.tsx
'use client';

import React, { useState, useEffect, useTransition, useMemo, useCallback } from 'react';
import {
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Loader2,
  ListTree,
  Search,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CompliancePathForm from './compliance-path-form';
import { Input } from './ui/input';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fetchPaths = useCallback(() => {
    setIsLoading(true);
    getCompliancePaths()
      .then(setPaths)
      .catch(() => {
        toast({
          title: 'Error',
          description: 'Failed to load compliance paths.',
          variant: 'destructive',
        });
      })
      .finally(() => setIsLoading(false));
  }, [toast]);

  useEffect(() => {
    fetchPaths();
  }, [fetchPaths]);

  const filteredPaths = useMemo(() => {
    if (!searchTerm) return paths;
    return paths.filter(
      path =>
        path.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        path.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        path.regulations.some(r =>
          r.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
    );
  }, [paths, searchTerm]);

  const handleCreateNew = () => {
    setSelectedPath(null);
    setIsFormOpen(true);
  };

  const handleEdit = (path: CompliancePath) => {
    setSelectedPath(path);
    setIsFormOpen(true);
  };

  const handleDelete = (path: CompliancePath) => {
    startTransition(async () => {
      try {
        await deleteCompliancePath(path.id, user.id);
        setPaths(prev => prev.filter(p => p.id !== path.id));
        toast({ title: `Compliance Path "${path.name}" Deleted` });
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
    setPaths(prev => {
        const exists = prev.some(p => p.id === savedPath.id);
        if (exists) {
            return prev.map(p => p.id === savedPath.id ? savedPath : p);
        }
        return [savedPath, ...prev];
    })
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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Compliance Paths
            </h1>
            <p className="text-muted-foreground">
              Manage the compliance standards and rule sets for products.
            </p>
          </div>
          {canManage && (
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" /> Create Path
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, category, or regulation..."
            className="pl-9"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredPaths.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPaths.map(path => (
              <Card key={path.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    {path.name}
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 -mt-2 -mr-2"
                          >
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
                                    This will permanently delete the path "
                                    {path.name}".
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(path)}
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
                  </CardTitle>
                  <CardDescription>{path.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Category</h4>
                    <Badge variant="outline">{path.category}</Badge>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Regulations</h4>
                    <div className="flex flex-wrap gap-1">
                      {path.regulations.map(reg => (
                        <Badge key={reg} variant="secondary">
                          {reg}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Rules</h4>
                    <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                      {path.rules.minSustainabilityScore !== undefined && (
                        <li>
                          Min. ESG Score: {path.rules.minSustainabilityScore}
                        </li>
                      )}
                      {path.rules.requiredKeywords &&
                        path.rules.requiredKeywords.length > 0 && (
                          <li>
                            Required Materials:{' '}
                            {path.rules.requiredKeywords.join(', ')}
                          </li>
                        )}
                      {path.rules.bannedKeywords &&
                        path.rules.bannedKeywords.length > 0 && (
                          <li>
                            Banned Materials:{' '}
                            {path.rules.bannedKeywords.join(', ')}
                          </li>
                        )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
            <ListTree className="mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">
              No Compliance Paths Found
            </h3>
            <p>No paths match your search, or none have been created yet.</p>
            {canManage && (
              <Button onClick={handleCreateNew} className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Create First Path
              </Button>
            )}
          </div>
        )}
      </div>
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
