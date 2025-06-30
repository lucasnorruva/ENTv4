// src/components/dashboards/manufacturer-dashboard.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import ProductTable from "../product-table";
import type { Product, User } from "@/types";
import { getProductionLines, getProducts } from "@/lib/actions";
import { useEffect, useState } from "react";
import type { ProductionLine } from "@/types";
import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowRight, BookCopy, Factory } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

export default function ManufacturerDashboard({ user }: { user: User }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [fetchedProducts, fetchedLines] = await Promise.all([
        getProducts(),
        getProductionLines(),
      ]);
      setProducts(fetchedProducts);
      setLines(fetchedLines);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  // Manufacturers would likely have a different set of actions,
  // but for now, we can show a read-only table.
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Manufacturer Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome, {user.fullName}. View products, production lines, and
          component traceability.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
            <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <div className="text-2xl font-bold">{products.length}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Across all production lines
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Production Lines
            </CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <div className="text-2xl font-bold">{lines.length}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Active, Idle, and Maintenance
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/dashboard/lines">
                Manage Lines <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Overview</CardTitle>
          <CardDescription>
            View all products and their lifecycle data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <ProductTable
              products={products}
              onEdit={() => alert("Editing not available in this view.")}
              onDelete={() => alert("Deleting not available in this view.")}
              onSubmitForReview={() =>
                alert("Submitting not available in this view.")
              }
              onRecalculateScore={() =>
                alert("Recalculating not available in this view.")
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
