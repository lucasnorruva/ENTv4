// src/components/company-management-client.tsx
'use client';

import React, { useState, useTransition } from 'react';
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
import { MoreHorizontal, Plus, Edit, Trash2 } from 'lucide-react';
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
} from '@/components/ui/alert-dialog';
import type { Company, User } from '@/types';
import CompanyForm from './company-form';
import { deleteCompany } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface CompanyManagementClientProps {
  initialCompanies: Company[];
  adminUser: User;
}

export default function CompanyManagementClient({
  initialCompanies,
  adminUser,
}: CompanyManagementClientProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleCreateNew = () => {
    setSelectedCompany(null);
    setIsFormOpen(true);
  };

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setIsFormOpen(true);
  };

  const handleDelete = (companyId: string) => {
    startTransition(async () => {
      try {
        await deleteCompany(companyId, adminUser.id);
        toast({
          title: 'Company Deleted',
          description: 'The company has been successfully deleted.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete company.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Company Management</CardTitle>
              <CardDescription>
                View, create, and manage all companies (tenants) in the system.
              </CardDescription>
            </div>
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" /> Create Company
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Company ID</TableHead>
                <TableHead>Owner ID</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialCompanies.map(company => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {company.id}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {company.ownerId}
                  </TableCell>
                  <TableCell>
                    {format(new Date(company.createdAt), 'PPP')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleEdit(company)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Company
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={e => e.preventDefault()}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Company
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete the company "{company.name}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(company.id)}
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <CompanyForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        company={selectedCompany}
        adminUser={adminUser}
      />
    </>
  );
}
