// src/app/dashboard/composition/page.tsx
import { getProducts } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import MaterialUsageChart from "@/components/charts/material-usage-chart";
import type { Product, Material } from "@/types";

interface AggregatedMaterial {
  name: string;
  count: number;
  totalRecycledContent: number;
  productCount: number;
  inProducts: string[];
}

const aggregateMaterials = (
  products: Product[],
): AggregatedMaterial[] => {
  const materialMap = new Map<string, AggregatedMaterial>();

  products.forEach(product => {
    product.materials.forEach(material => {
      const existing = materialMap.get(material.name);
      if (existing) {
        existing.count++;
        existing.totalRecycledContent += material.recycledContent ?? 0;
        existing.productCount++;
        if (!existing.inProducts.includes(product.productName)) {
            existing.inProducts.push(product.productName);
        }
      } else {
        materialMap.set(material.name, {
          name: material.name,
          count: 1,
          totalRecycledContent: material.recycledContent ?? 0,
          productCount: 1,
          inProducts: [product.productName],
        });
      }
    });
  });

  return Array.from(materialMap.values()).sort((a, b) => b.count - a.count);
};

export default async function MaterialCompositionPage() {
  const user = await getCurrentUser('Recycler');
  const products = await getProducts(user.id);
  const materialData = aggregateMaterials(products);

  const chartData = materialData
    .slice(0, 10)
    .map(m => ({ material: m.name, count: m.count }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Material Composition Analysis
        </h1>
        <p className="text-muted-foreground">
          An overview of materials used across all registered products.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top 10 Most Used Materials</CardTitle>
          <CardDescription>
            Frequency of materials appearing in product passports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MaterialUsageChart data={chartData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Full Material Breakdown</CardTitle>
          <CardDescription>
            A detailed list of all materials and their usage statistics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Usage Count</TableHead>
                <TableHead>Avg. Recycled Content</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materialData.map(material => (
                <TableRow key={material.name}>
                  <TableCell className="font-medium">{material.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{material.count}</Badge>
                  </TableCell>
                  <TableCell>
                    {material.productCount > 0
                      ? `${Math.round(
                          material.totalRecycledContent / material.productCount,
                        )}%`
                      : "N/A"}
                  </TableCell>
                </TableRow>
              ))}
              {materialData.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                        No material data available.
                    </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
