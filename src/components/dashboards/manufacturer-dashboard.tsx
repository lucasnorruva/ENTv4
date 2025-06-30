// src/components/dashboards/manufacturer-dashboard.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ProductTable from "../product-table";
import type { Product, User } from "@/types";

export default function ManufacturerDashboard({
  products,
  user,
}: {
  products: Product[];
  user: User;
}) {
  // Manufacturers would likely have a different set of actions,
  // but for now, we can show a read-only table.
  return (
    <Card>
      <CardHeader>
        <CardTitle>Manufacturer Dashboard</CardTitle>
        <CardDescription>
          View all products and their lifecycle data.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
