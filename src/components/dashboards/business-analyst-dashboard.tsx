// src/components/dashboards/business-analyst-dashboard.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Product, User } from "@/types";
import ComplianceOverviewChart from "../charts/compliance-overview-chart";
import { Button } from "../ui/button";
import { FileDown, ArrowRight } from "lucide-react";
import SustainabilityByCategoryChart from "../charts/sustainability-by-category-chart";
import Link from "next/link";

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

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analyst Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome, {user.fullName}. Analyze compliance trends, product
          lifecycle status, and generate reports.
        </p>
      </div>

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
            <CardTitle>ESG Score Distribution</CardTitle>
            <CardDescription>Average ESG scores by category.</CardDescription>
          </CardHeader>
          <CardContent>
            <SustainabilityByCategoryChart
              data={sustainabilityByCategoryData}
            />
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/sustainability">
                View Detailed Report <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
