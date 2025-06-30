// src/components/product-management.tsx
"use client";

import React, { useState, useTransition } from "react";
import { Plus } from "lucide-react";

import type { Product, User } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProductForm from "./product-form";
import ProductTable from "./product-table";
import {
  deleteProduct,
  submitForReview,
  recalculateScore,
} from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

interface ProductManagementProps {
  initialProducts: Product[];
  user: User;
}

export default function ProductManagement({
  initialProducts,
  user,
}: ProductManagementProps) {
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
      await deleteProduct(id, user.id);
      toast({
        title: "Product Deleted",
        description: "The product passport has been successfully deleted.",
      });
    });
  };

  const handleSubmitForReview = (id: string) => {
    startTransition(async () => {
      try {
        const reviewedProduct = await submitForReview(id, user.id);
        toast({
          title: "Product Submitted",
          description: `"${reviewedProduct.productName}" has been submitted for review.`,
        });
      } catch (error) {
        toast({
          title: "Submission Failed",
          description: "There was an error submitting the product for review.",
          variant: "destructive",
        });
      }
    });
  };

  const handleRecalculateScore = (id: string) => {
    startTransition(async () => {
      try {
        const updatedProduct = await recalculateScore(id, user.id);
        toast({
          title: "AI Data Recalculated",
          description: `AI-generated fields for "${updatedProduct.productName}" have been updated.`,
        });
      } catch (error) {
        toast({
          title: "Recalculation Failed",
          description: "There was an error recalculating the score.",
          variant: "destructive",
        });
      }
    });
  };

  const handleSave = () => {
    // The form submission is now handled inside ProductForm,
    // which calls a server action. The revalidation will update the table.
    setIsSheetOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Product Passports</CardTitle>
              <CardDescription>
                Manage and display digital product passports for your products.
              </CardDescription>
            </div>
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" /> Create New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ProductTable
            products={initialProducts}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSubmitForReview={handleSubmitForReview}
            onRecalculateScore={handleRecalculateScore}
          />
        </CardContent>
      </Card>
      <ProductForm
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        product={selectedProduct}
        onSave={handleSave}
        user={user}
      />
    </>
  );
}
