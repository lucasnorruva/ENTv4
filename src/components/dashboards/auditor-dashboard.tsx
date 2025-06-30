// src/components/dashboards/auditor-dashboard.tsx
"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Product, User } from "@/types";
import { AlertCircle, CheckCircle, FileWarning } from "lucide-react";

export default function AuditorDashboard({
  products,
  user,
}: {
  products: Product[];
  user: User;
}) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const productsToAudit = products.filter(
    (p) =>
      p.verificationStatus === "Pending" || p.verificationStatus === "Failed",
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
              {productsToAudit.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    {product.productName}
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        product.verificationStatus === "Failed"
                          ? "destructive"
                          : "secondary"
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
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>
                Review: {selectedProduct.productName}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Below is the summary and detailed gaps from the last automated
                verification check.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-6 my-4 max-h-[60vh] overflow-y-auto pr-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-base">Overall Summary</h3>
                <Alert
                  variant={
                    selectedProduct.verificationStatus === "Failed"
                      ? "destructive"
                      : "default"
                  }
                >
                  {selectedProduct.verificationStatus === "Failed" ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {selectedProduct.verificationStatus || "Pending"}
                  </AlertTitle>
                  <AlertDescription>
                    {selectedProduct.complianceSummary ||
                      "No summary was provided for this check."}
                  </AlertDescription>
                </Alert>
              </div>

              {selectedProduct.complianceGaps &&
                selectedProduct.complianceGaps.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-base">
                      Identified Gaps
                    </h3>
                    <div className="space-y-2">
                      {selectedProduct.complianceGaps.map((gap, index) => (
                        <Card key={index} className="p-3 bg-muted/50">
                          <div className="flex items-start gap-3">
                            <FileWarning className="h-5 w-5 mt-1 shrink-0 text-amber-600" />
                            <div className="flex-1">
                              <p className="font-semibold text-sm text-foreground">
                                {gap.regulation}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {gap.issue}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

              <div className="text-xs text-muted-foreground pt-2">
                Last Checked:{" "}
                {selectedProduct.lastVerificationDate
                  ? new Date(
                      selectedProduct.lastVerificationDate,
                    ).toLocaleString()
                  : "N/A"}
              </div>
            </div>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={handleApprove}>Approve Passport</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
