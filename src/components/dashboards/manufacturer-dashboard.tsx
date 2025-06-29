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
import type { Product } from "@/types";

export default function ManufacturerDashboard({
  products,
}: {
  products: Product[];
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
        />
      </CardContent>
    </Card>
  );
}
