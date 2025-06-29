// src/components/dashboards/auditor-dashboard.tsx
'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Product } from '@/types';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function AuditorDashboard({ products }: { products: Product[] }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const productsToAudit = products.filter(
    p => p.verificationStatus === 'Pending' || p.verificationStatus === 'Failed'
  );

  const handleReviewClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleApprove = () => {
    // In a real app, this would trigger a server action to update the product status
    alert(`Product ${selectedProduct?.productName} approved.`);
    setIsDialogOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Auditor Dashboard</CardTitle>
          <CardDescription>
            Review products for compliance, run checks, and view audit history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsToAudit.map(product => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    {product.productName}
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        product.verificationStatus === 'Failed'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {product.verificationStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReviewClick(product)}
                    >
                      Review Product
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {productsToAudit.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <p>No products are currently in the audit queue.</p>
            </div>
          )}
        </CardContent>
      </Card>
      {selectedProduct && (
        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Review: {selectedProduct.productName}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Below is the summary from the last automated verification check.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 my-4">
              <h3 className="font-semibold text-sm">Compliance Summary:</h3>
              {selectedProduct.verificationStatus === 'Failed' ? (
                <div className="flex items-start gap-3 text-sm text-destructive bg-destructive/10 p-4 rounded-md">
                   <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                   <p>{selectedProduct.complianceSummary || 'No specific details were provided for this failure.'}</p>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-sm text-green-600 bg-green-500/10 p-4 rounded-md">
                   <CheckCircle className="h-4 w-4 shrink-0"/>
                   <p>{selectedProduct.complianceSummary || 'No issues found in the last automated check.'}</p>
                </div>
              )}
               <div className="text-xs text-muted-foreground pt-2">
                    Last Checked: {selectedProduct.lastVerificationDate ? new Date(selectedProduct.lastVerificationDate).toLocaleString() : 'N/A'}
               </div>
            </div>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Close</Button>
              <Button onClick={handleApprove}>Approve Passport</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
