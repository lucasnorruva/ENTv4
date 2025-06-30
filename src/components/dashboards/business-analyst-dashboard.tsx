// src/components/dashboards/business-analyst-dashboard.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Product, User } from "@/types";
import ComplianceOverviewChart from "../charts/compliance-overview-chart";
import { Button } from "../ui/button";
import { FileDown } from "lucide-react";
import SustainabilityByCategoryChart from "../charts/sustainability-by-category-chart";

export default function BusinessAnalystDashboard({
  products,
  user,
}: {
  products: Product[];
  user: User;
}) {
  const complianceData = {
    verified: products.filter((p) => p.verificationStatus === "Verified")
      .length,
    pending: products.filter((p) => p.verificationStatus === "Pending").length,
    failed: products.filter((p) => p.verificationStatus === "Failed").length,
  };

  const categoryScores = products.reduce(
    (acc, product) => {
      if (product.sustainabilityScore !== undefined) {
        if (!acc[product.category]) {
          acc[product.category] = { totalScore: 0, count: 0 };
        }
        acc[product.category].totalScore += product.sustainabilityScore;
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

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Business Analyst Dashboard</CardTitle>
              <CardDescription>
                Analyze compliance trends, product lifecycle status, and
                generate reports.
              </CardDescription>
            </div>
            <Button variant="outline">
              <FileDown className="mr-2" />
              Export Report
            </Button>
          </div>
        </CardHeader>
      </Card>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Compliance Overview</CardTitle>
            <CardDescription>
              Current verification status of all products.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ComplianceOverviewChart data={complianceData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sustainability Score Distribution</CardTitle>
            <CardDescription>
              Average sustainability scores by category.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SustainabilityByCategoryChart
              data={sustainabilityByCategoryData}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
