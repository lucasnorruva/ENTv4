// src/components/dashboards/supplier-dashboard.tsx
"use client";

import React, { useState, useTransition } from "react";
import { Plus } from "lucide-react";

import type { Product } from "@/types";
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
import { deleteProduct } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

export default function SupplierDashboard({
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
      setProducts((currentProducts) =>
        currentProducts.filter((p) => p.id !== id),
      );
      toast({
        title: "Product Deleted",
        description: "The product passport has been successfully deleted.",
      });
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
          <ProductTable
            products={products}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
      <ProductForm
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        product={selectedProduct}
        onSave={handleSave}
      />
    </>
  );
}
