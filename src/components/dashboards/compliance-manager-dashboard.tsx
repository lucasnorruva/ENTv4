// src/components/dashboards/compliance-manager-dashboard.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Product, User } from '@/types';
import { AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function ComplianceManagerDashboard({
  flaggedProducts,
  user,
}: {
  flaggedProducts: Product[];
  user: User;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Compliance Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome, {user.fullName}. Here is an overview of the current
          compliance status.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Flagged Products
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flaggedProducts.length}</div>
            <p className="text-xs text-muted-foreground">
              Products requiring immediate attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Manage Compliance Issues</CardTitle>
            <CardDescription>
              Review products that have failed verification, investigate the
              issues, and work with suppliers to resolve them.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/dashboard/flagged">
                Go to Flagged Products Queue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
