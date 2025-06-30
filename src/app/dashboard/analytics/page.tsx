// src/app/dashboard/analytics/page.tsx
import { getProducts, getAuditLogs } from "@/lib/actions";
import { getMockUsers } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Activity,
  BookCopy,
  FileQuestion,
  ShieldCheck,
  Users,
} from "lucide-react";
import ComplianceOverviewChart from "@/components/charts/compliance-overview-chart";
import ProductsOverTimeChart from "@/components/charts/products-over-time-chart";
import { format, subDays } from "date-fns";

export default async function AnalyticsPage() {
  const [products, users, auditLogs] = await Promise.all([
    getProducts(),
    getMockUsers(),
    getAuditLogs(),
  ]);

  const complianceData = {
    verified: products.filter((p) => p.verificationStatus === "Verified")
      .length,
    pending: products.filter((p) => p.verificationStatus === "Pending").length,
    failed: products.filter((p) => p.verificationStatus === "Failed").length,
  };

  // Group products by creation date for the time-series chart
  const productsByDate = products.reduce(
    (acc, product) => {
      const date = format(new Date(product.createdAt), "yyyy-MM-dd");
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date]++;
      return acc;
    },
    {} as Record<string, number>,
  );

  const productsOverTimeData = Object.entries(productsByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const recentActivity = auditLogs.slice(0, 5);
  const productMap = new Map(products.map((p) => [p.id, p.productName]));
  const userMap = new Map(users.map((u) => [u.id, u.fullName]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Analytics</h1>
        <p className="text-muted-foreground">
          An overview of platform activity and key metrics.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all suppliers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              All roles included
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Verified Passports
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceData.verified}</div>
            <p className="text-xs text-muted-foreground">
              Successfully anchored on-chain
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Audits Today
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                auditLogs.filter(
                  (log) =>
                    new Date(log.createdAt) > subDays(new Date(), 1) &&
                    log.action.includes("passport."),
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">In the last 24h</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Products Created Over Time</CardTitle>
            <CardDescription>
              A view of new passports being created on the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductsOverTimeChart data={productsOverTimeData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Compliance Overview</CardTitle>
            <CardDescription>
              A snapshot of the current verification status across all
              products.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ComplianceOverviewChart data={complianceData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
