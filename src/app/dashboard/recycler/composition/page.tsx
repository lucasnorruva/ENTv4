// src/app/dashboard/recycler/composition/page.tsx
import { redirect } from 'next/navigation';
import { getProducts } from '@/lib/actions';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { UserRoles, type Role } from '@/lib/constants';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import MaterialUsageChart from '@/components/charts/material-usage-chart';
import type { Product } from '@/types';

interface AggregatedMaterial {
  name: string;
  count: number;
  totalRecycledContent: number;
  productCount: number;
  inProducts: string[];
}

const aggregateMaterials = (products: Product[]): AggregatedMaterial[] => {
  const materialMap = new Map<string, AggregatedMaterial>();

  products.forEach(product => {
    product.materials.forEach(material => {
      const existing = materialMap.get(material.name);
      if (existing) {
        existing.count++;
        if (material.recycledContent !== undefined) {
          existing.totalRecycledContent += material.recycledContent;
          existing.productCount++;
        }
        if (!existing.inProducts.includes(product.productName)) {
          existing.inProducts.push(product.productName);
        }
      } else {
        materialMap.set(material.name, {
          name: material.name,
          count: 1,
          totalRecycledContent: material.recycledContent ?? 0,
          productCount: material.recycledContent !== undefined ? 1 : 0,
          inProducts: [product.productName],
        });
      }
    });
  });

  return Array.from(materialMap.values()).sort((a, b) => b.count - a.count);
};

export default async function MaterialCompositionPage() {
  const user = await getCurrentUser(UserRoles.RECYCLER);

  const allowedRoles: Role[] = [
    UserRoles.RECYCLER,
    UserRoles.MANUFACTURER,
    UserRoles.BUSINESS_ANALYST,
  ];

  if (!allowedRoles.some(role => hasRole(user, role))) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

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
                      : 'N/A'}
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
