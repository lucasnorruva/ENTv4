// src/components/dashboards/business-analyst-dashboard.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Product } from '@/types';
import ComplianceOverviewChart from '../charts/compliance-overview-chart';
import { Button } from '../ui/button';
import { FileDown } from 'lucide-react';

export default function BusinessAnalystDashboard({ products }: { products: Product[] }) {
  const complianceData = {
      verified: products.filter(p => p.verificationStatus === 'Verified').length,
      pending: products.filter(p => p.verificationStatus === 'Pending').length,
      failed: products.filter(p => p.verificationStatus === 'Failed').length,
  };

  return (
    <div className="grid gap-6">
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Business Analyst Dashboard</CardTitle>
                        <CardDescription>
                        Analyze compliance trends, product lifecycle status, and generate reports.
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
                    <CardDescription>Current verification status of all products.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ComplianceOverviewChart data={complianceData}/>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Sustainability Score Distribution</CardTitle>
                    <CardDescription>Average sustainability scores by category.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Placeholder for another chart */}
                    <div className="h-60 flex items-center justify-center text-muted-foreground bg-muted/50 rounded-lg">
                        <p>Chart coming soon</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
