// src/components/dashboards/business-analyst-dashboard-client.tsx
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { User } from '@/types';
import ComplianceOverviewChart from '../charts/compliance-overview-chart';
import { Button } from '../ui/button';
import { FileDown, ArrowRight } from 'lucide-react';
import SustainabilityByCategoryChart from '../charts/sustainability-by-category-chart';
import Link from 'next/link';

interface BusinessAnalystDashboardClientProps {
  user: User;
  complianceData: {
    verified: number;
    pending: number;
    failed: number;
  };
  sustainabilityByCategoryData: {
    category: string;
    averageScore: number;
  }[];
}

export default function BusinessAnalystDashboardClient({
  user,
  complianceData,
  sustainabilityByCategoryData,
}: BusinessAnalystDashboardClientProps) {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Business Analyst Dashboard
        </h1>
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
              <Link href="/dashboard/business-analyst/sustainability">
                View Detailed Report <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-muted-foreground" />
            Data Export
          </CardTitle>
          <CardDescription>
            Generate and download reports for products, compliance, and
            sustainability data.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild>
            <Link href="/dashboard/business-analyst/export">
              Go to Export Center <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
