// src/app/dashboard/sustainability/page.tsx
import { getProducts } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SustainabilityByCategoryChart from "@/components/charts/sustainability-by-category-chart";
import SustainabilityTable from "@/components/sustainability-table";
import { BarChart3 } from "lucide-react";

export default async function SustainabilityPage() {
  const user = await getCurrentUser('Business Analyst');
  const products = await getProducts(user.id);

  const categoryScores = products.reduce(
    (acc, product) => {
      if (product.sustainability?.score !== undefined) {
        if (!acc[product.category]) {
          acc[product.category] = { totalScore: 0, count: 0 };
        }
        acc[product.category].totalScore += product.sustainability.score;
        acc[product.category].count++;
      }
      return acc;
    },
    {} as Record<string, { totalScore: number; count: number }>,
  );

  const sustainabilityByCategoryData = Object.entries(categoryScores).map(
    ([category, data]) => ({
      category,
      averageScore:
        data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
    }),
  );

  const scoredProducts = products.filter(
    p => p.sustainability?.score !== undefined,
  );
  const averageScore =
    scoredProducts.length > 0
      ? Math.round(
          scoredProducts.reduce(
            (sum, p) => sum + (p.sustainability?.score ?? 0),
            0,
          ) / scoredProducts.length,
        )
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Sustainability Metrics
        </h1>
        <p className="text-muted-foreground">
          Analyze ESG scores and sustainability data across all products.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average ESG Score
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore} / 100</div>
            <p className="text-xs text-muted-foreground">
              Across all products with a score
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ESG Score by Category</CardTitle>
          <CardDescription>
            Drill down into the average ESG performance for each product
            category.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SustainabilityByCategoryChart data={sustainabilityByCategoryData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product ESG Details</CardTitle>
          <CardDescription>
            View and sort individual products by their ESG score and sub-scores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SustainabilityTable products={scoredProducts} />
        </CardContent>
      </Card>
    </div>
  );
}
