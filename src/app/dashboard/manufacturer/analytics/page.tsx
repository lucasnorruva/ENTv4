// src/app/dashboard/manufacturer/analytics/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Collections } from '@/lib/constants';
import type { User, Product, ProductionLine, ServiceTicket } from '@/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Activity,
  BookCopy,
  Factory,
  Clock,
  Wrench,
  Gauge,
  Loader2,
} from 'lucide-react';
import ProductsOverTimeChart from '@/components/charts/products-over-time-chart';
import { format, subDays, formatDistanceToNow } from 'date-fns';
import ProductionOutputChart from '@/components/charts/production-output-chart';
import ProductionLineStatusChart from '@/components/charts/production-line-status-chart';

export default function AnalyticsPage({ user }: { user: User }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [serviceTickets, setServiceTickets] = useState<ServiceTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    const productQuery = query(collection(db, Collections.PRODUCTS), where('companyId', '==', user.companyId));
    unsubscribes.push(onSnapshot(productQuery, snapshot => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setIsLoading(false);
    }));

    const linesQuery = query(collection(db, Collections.PRODUCTION_LINES), where('companyId', '==', user.companyId));
    unsubscribes.push(onSnapshot(linesQuery, snapshot => {
      setLines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductionLine)));
    }));

    const ticketsQuery = query(collection(db, Collections.SERVICE_TICKETS)); // Could be filtered further if needed
    unsubscribes.push(onSnapshot(ticketsQuery, snapshot => {
      setServiceTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceTicket)));
    }));

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user.companyId]);
  
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const lineStats = {
    totalLines: lines.length,
    activeLines: lines.filter(l => l.status === 'Active').length,
    idleLines: lines.filter(l => l.status === 'Idle').length,
    maintenanceLines: lines.filter(l => l.status === 'Maintenance').length,
    totalOutput: lines.reduce((sum, l) => sum + (l.status === 'Active' ? l.outputPerHour : 0), 0),
  };
  
  const lineStatusData = {
    active: lineStats.activeLines,
    idle: lineStats.idleLines,
    maintenance: lineStats.maintenanceLines,
  };

  const lineOutputData = lines
    .filter(l => l.status === 'Active')
    .map(l => ({ name: l.name, output: l.outputPerHour }))
    .sort((a,b) => b.output - a.output);

  const productsByDate = products.reduce(
    (acc, product) => {
      const date = format(new Date(product.createdAt), 'yyyy-MM-dd');
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

  const recentMaintenance = serviceTickets
    .filter(t => t.productionLineId && lines.some(l => l.id === t.productionLineId))
    .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const lineMap = new Map(lines.map(l => [l.id, l.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Manufacturer Analytics
        </h1>
        <p className="text-muted-foreground">
          An overview of your company's production and product metrics.
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
            <p className="text-xs text-muted-foreground">Managed by your company</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production Lines</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lineStats.totalLines}</div>
            <p className="text-xs text-muted-foreground">{lineStats.activeLines} active, {lineStats.maintenanceLines} in maintenance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Output</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lineStats.totalOutput}</div>
            <p className="text-xs text-muted-foreground">Units per hour from active lines</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Maintenance
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                serviceTickets.filter(
                  log =>
                    log.productionLineId && new Date(log.createdAt) > subDays(new Date(), 30),
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Tickets in the last 30 days</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Production Output by Line</CardTitle>
            <CardDescription>
              Output per hour for all currently active production lines.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductionOutputChart data={lineOutputData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Production Line Status</CardTitle>
            <CardDescription>
              A breakdown of the current operational status of all lines.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductionLineStatusChart data={lineStatusData} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Products Created Over Time</CardTitle>
            <CardDescription>
              A view of new passports being created by your company.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductsOverTimeChart data={productsOverTimeData} />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Maintenance Activity</CardTitle>
          <CardDescription>
            A stream of the latest service tickets for your production lines.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentMaintenance.map(ticket => {
              const lineName = ticket.productionLineId ? lineMap.get(ticket.productionLineId) : 'Unknown Line';
              return (
                <div key={ticket.id} className="flex items-center gap-4">
                  <div className="p-2 bg-muted rounded-full">
                    <Wrench className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {ticket.issue}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Line: {lineName}
                    </p>
                  </div>
                  <p
                    className="text-xs text-muted-foreground shrink-0"
                    suppressHydrationWarning
                  >
                    {formatDistanceToNow(new Date(ticket.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              );
            })}
            {recentMaintenance.length === 0 && (
              <p className="text-sm text-center text-muted-foreground py-4">
                No recent maintenance activity.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
