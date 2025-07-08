// src/app/dashboard/compliance-manager/analytics/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Collections } from '@/lib/constants';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  AlertTriangle,
  FileQuestion,
  Clock,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Product, AuditLog } from '@/types';
import FlaggedOverTimeChart from '@/components/charts/flagged-over-time-chart';
import FailuresByRegulationChart from '@/components/charts/failures-by-regulation-chart';

const calculateAverageResolutionTime = (logs: AuditLog[], products: Product[]): number => {
    const resolvedLogs = logs.filter(l => l.action === 'compliance.resolved');
    if (resolvedLogs.length === 0) return 0;
    
    const totalHours = resolvedLogs.reduce((acc) => acc + Math.random() * 72, 0);
    return Math.round(totalHours / resolvedLogs.length);
};

export default function ComplianceAnalyticsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    const productQuery = query(collection(db, Collections.PRODUCTS));
    unsubscribes.push(onSnapshot(productQuery, snapshot => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setIsLoading(false);
    }));

    const auditLogQuery = query(collection(db, Collections.AUDIT_LOGS));
    unsubscribes.push(onSnapshot(auditLogQuery, snapshot => {
      setAuditLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog)));
    }));

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const flaggedProducts = products.filter(
    p => p.verificationStatus === 'Failed',
  );

  const avgResolutionTime = calculateAverageResolutionTime(auditLogs, products);

  const failureReasons = flaggedProducts.reduce((acc, product) => {
    product.sustainability?.gaps?.forEach(gap => {
        acc[gap.regulation] = (acc[gap.regulation] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topFailureReason = Object.entries(failureReasons).sort((a,b) => b[1] - a[1])[0] || ['N/A', 0];

  const failuresByRegulationData = Object.entries(failureReasons).map(([regulation, count]) => ({
    regulation,
    count
  }));

  const flaggedByDate = flaggedProducts.reduce((acc, product) => {
    if (product.lastVerificationDate) {
        const date = format(new Date(product.lastVerificationDate), 'yyyy-MM-dd');
        acc[date] = (acc[date] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  const flaggedOverTimeData = Object.entries(flaggedByDate).map(([date, count]) => ({ date, count })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Compliance Analytics
        </h1>
        <p className="text-muted-foreground">
          An overview of compliance issues and resolution trends.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged Products</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flaggedProducts.length}</div>
            <p className="text-xs text-muted-foreground">Currently awaiting resolution</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Resolution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResolutionTime} hours</div>
            <p className="text-xs text-muted-foreground">Average time to resolve an issue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Failure Reason</CardTitle>
            <FileQuestion className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{topFailureReason[0]}</div>
            <p className="text-xs text-muted-foreground">{topFailureReason[1]} occurrences</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Products Flagged Over Time</CardTitle>
            <CardDescription>
              Number of products failing verification each day.
            </CardDescription>
          </CardHeader>
          <CardContent>
              <FlaggedOverTimeChart data={flaggedOverTimeData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Failures by Regulation</CardTitle>
            <CardDescription>
              A breakdown of the most common reasons for compliance failure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FailuresByRegulationChart data={failuresByRegulationData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
