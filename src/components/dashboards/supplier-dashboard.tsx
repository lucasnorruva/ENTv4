// src/components/dashboards/supplier-dashboard.tsx
"use client";

import React, { useState, useTransition, useEffect } from "react";
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
import ProductForm from "../product-form";
import ProductTable from "../product-table";
import {
  deleteProduct,
  submitForReview,
  recalculateScore,
} from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "../ui/skeleton";

export default function SupplierDashboard({
  initialProducts,
  user,
}: {
  initialProducts: Product[];
  user: User;
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setProducts(initialProducts);
    setIsLoading(false);
  }, [initialProducts]);


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
      setProducts((currentProducts) =>
        currentProducts.filter((p) => p.id !== id),
      );
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
        setProducts((currentProducts) =>
          currentProducts.map((p) => (p.id === id ? reviewedProduct : p)),
        );
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
        setProducts((currentProducts) =>
          currentProducts.map((p) => (p.id === id ? updatedProduct : p)),
        );
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

  const handleSave = (savedProduct: Product) => {
    if (selectedProduct) {
      // Update
      setProducts((currentProducts) =>
        currentProducts.map((p) =>
          p.id === savedProduct.id ? savedProduct : p,
        ),
      );
    } else {
      // Create
      setProducts((currentProducts) => [savedProduct, ...currentProducts]);
    }
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
          {isLoading ? (
             <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
          ) : (
            <ProductTable
              products={products}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSubmitForReview={handleSubmitForReview}
              onRecalculateScore={handleRecalculateScore}
            />
          )}
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
