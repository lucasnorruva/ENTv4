'use client';

import React, { useState, useTransition } from 'react';
import Image from 'next/image';
import {
  Bell,
  BookCopy,
  Code,
  FilePenLine,
  LayoutGrid,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UserCircle,
} from 'lucide-react';
import type { Product } from '@/types';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PassportForm from './passport-form';
import { deleteProduct } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
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
import { format } from 'date-fns';
import { Progress } from './ui/progress';

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <LayoutGrid className="h-7 w-7 text-primary" />
      <h1 className="text-xl font-bold">Norruva</h1>
    </div>
  );
}

export default function PassportDashboard({
  initialProducts,
}: {
  initialProducts: Product[];
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleCreateNew = () => {
    setSelectedProduct(null);
    setIsSheetOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsSheetOpen(true);
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteProduct(id);
      setProducts(currentProducts => currentProducts.filter(p => p.id !== id));
      toast({
        title: 'Passport Deleted',
        description: 'The product passport has been successfully deleted.',
      });
    });
  };

  const handleSave = (savedProduct: Product) => {
    if (selectedProduct) {
      // Update
      setProducts(currentProducts =>
        currentProducts.map(p => (p.id === savedProduct.id ? savedProduct : p))
      );
    } else {
      // Create
      setProducts(currentProducts => [savedProduct, ...currentProducts]);
    }
    setIsSheetOpen(false);
  };
  
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


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Passports" isActive>
                <BookCopy />
                <span>Passports</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton tooltip="Compliance">
                <ShieldCheck />
                <span>Compliance</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="API Integration">
                <Code />
                <span>API Integration</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Settings">
                <Settings />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search passports..." className="pl-9" />
          </div>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <UserCircle className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Product Passports</CardTitle>
                  <CardDescription>
                    Manage and display digital product passports for your enterprise.
                  </CardDescription>
                </div>
                <Button onClick={handleCreateNew}>
                  <Plus className="mr-2 h-4 w-4" /> Create New
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Sustainability</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map(product => (
                    <TableRow key={product.id}>
                      <TableCell>
                         <Image
                            src={product.productImage}
                            alt={product.productName}
                            width={40}
                            height={40}
                            className="rounded-md"
                            data-ai-hint="product photo"
                          />
                      </TableCell>
                      <TableCell className="font-medium">{product.productName}</TableCell>
                      <TableCell>
                        {product.sustainabilityScore !== undefined ? (
                          <div className="flex items-center gap-2" title={product.sustainabilityReport}>
                              <Progress value={product.sustainabilityScore} className="w-20 h-2" />
                              <span>{product.sustainabilityScore}/100</span>
                          </div>
                        ) : (
                            <span className="text-muted-foreground text-xs italic">Pending...</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(product.status)}>{product.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getVerificationVariant(product.verificationStatus)}>
                          {product.verificationStatus ?? 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(product.lastUpdated), 'PPP')}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(product)}>
                              <FilePenLine className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                                  <span className="text-destructive">Delete</span>
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the passport for "{product.productName}".
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(product.id)}
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
        </main>
        <PassportForm
          isOpen={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          product={selectedProduct}
          onSave={handleSave}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
