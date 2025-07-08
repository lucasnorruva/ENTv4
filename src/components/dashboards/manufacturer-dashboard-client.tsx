// src/components/dashboards/manufacturer-dashboard-client.tsx
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import type { User, Product, ProductionLine } from '@/types';
import { Button } from '../ui/button';
import Link from 'next/link';
import { ArrowRight, BookCopy, Factory, Activity, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface ManufacturerDashboardClientProps {
  user: User;
  products: Product[];
  lines: ProductionLine[];
}

export default function ManufacturerDashboardClient({
  user,
  products,
  lines,
}: ManufacturerDashboardClientProps) {
  const stats = {
    totalProducts: products.length,
    totalLines: lines.length,
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Maintenance':
        return 'destructive';
      case 'Idle':
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Manufacturer Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome, {user.fullName}. View products, production lines, and
          component traceability.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Across all production lines
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Production Lines
            </CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLines}</div>
            <p className="text-xs text-muted-foreground">
              Active, Idle, and Maintenance
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Production Line Status</CardTitle>
          <CardDescription>
            An overview of current activity on the factory floor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {lines.slice(0, 5).map(line => (
            <div
              key={line.id}
              className="flex flex-wrap items-center justify-between gap-4 p-3 border rounded-lg"
            >
              <div>
                <h4 className="font-semibold">{line.name}</h4>
                <p className="text-sm text-muted-foreground">
                  Producing: {line.currentProduct}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <Badge variant={getStatusVariant(line.status)}>
                  {line.status}
                </Badge>
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  <span>{line.outputPerHour} units/hr</span>
                </div>
                <div className="flex items-center gap-1">
                  <Wrench className="h-3 w-3" />
                  <span suppressHydrationWarning>
                    Maint:{' '}
                    {formatDistanceToNow(new Date(line.lastMaintenance), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {lines.length === 0 && (
            <p className="text-sm text-center text-muted-foreground py-4">
              No production lines found.
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/dashboard/manufacturer/lines">
              Manage All Lines <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
