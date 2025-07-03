// src/components/production-line-management-client.tsx
'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Factory,
} from 'lucide-react';

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

import type { ProductionLine, User, Product } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getProductionLines, deleteProductionLine, getProducts } from '@/lib/actions';
import ProductionLineForm from './production-line-form';

interface ProductionLineManagementClientProps {
  user: User;
}

export default function ProductionLineManagementClient({
  user,
}: ProductionLineManagementClientProps) {
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLine, setSelectedLine] = useState<ProductionLine | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    // For a real-time app, you'd use a listener here.
    // For mock data, a simple fetch is fine.
    async function fetchInitialData() {
      try {
        const [initialLines, initialProducts] = await Promise.all([
            getProductionLines(),
            getProducts(user.id)
        ]);
        setLines(initialLines);
        setProducts(initialProducts);
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to load initial data.', variant: 'destructive'});
      } finally {
        setIsLoading(false);
      }
    }
    fetchInitialData();
  }, [toast, user.id]);

  const handleCreateNew = () => {
    setSelectedLine(null);
    setIsFormOpen(true);
  };

  const handleEdit = (line: ProductionLine) => {
    setSelectedLine(line);
    setIsFormOpen(true);
  };

  const handleDelete = (lineId: string) => {
    startTransition(async () => {
      try {
        await deleteProductionLine(lineId, user.id);
        setLines(prev => prev.filter(l => l.id !== lineId));
        toast({
          title: 'Production Line Deleted',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete production line.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleSave = () => {
    // Optimistically re-fetch after save
    getProductionLines().then(setLines);
    setIsFormOpen(false);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Maintenance':
        return 'destructive';
      case 'Idle':
      default:
        return 'secondary';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Production Lines</CardTitle>
              <CardDescription>
                Manage and monitor all manufacturing lines.
              </CardDescription>
            </div>
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" /> Add Line
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Line Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Current Product</TableHead>
                  <TableHead>Output</TableHead>
                  <TableHead>Last Maintenance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map(line => (
                  <TableRow key={line.id}>
                    <TableCell className="font-medium">
                      {line.name}
                      <p className="text-xs text-muted-foreground font-normal">
                        {line.location}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(line.status)}>
                        {line.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{line.currentProduct}</TableCell>
                    <TableCell>{line.outputPerHour} units/hr</TableCell>
                    <TableCell suppressHydrationWarning>
                      {formatDistanceToNow(new Date(line.lastMaintenance), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleEdit(line)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
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
                                  This will permanently delete the line "
                                  {line.name}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(line.id)}
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
                {lines.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <Factory className="h-12 w-12 text-muted-foreground" />
                        <h3 className="text-xl font-semibold">
                          No Production Lines
                        </h3>
                        <p className="text-muted-foreground">
                          Add a production line to get started.
                        </p>
                        <Button onClick={handleCreateNew}>
                          <Plus className="mr-2 h-4 w-4" /> Add Line
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <ProductionLineForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        line={selectedLine}
        user={user}
        onSave={handleSave}
        products={products}
      />
    </>
  );
}
