// src/app/dashboard/business-analyst/analytics/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Collections } from '@/lib/constants'; // Import Collections
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  BookCopy,
  ShieldCheck,
  Building2,
  Activity,
  Loader2,
} from 'lucide-react';
import ComplianceOverviewChart from '@/components/charts/compliance-overview-chart';
import ProductsOverTimeChart from '@/components/charts/products-over-time-chart';
import ComplianceRateChart from '@/components/charts/compliance-rate-chart';
import { format, subDays } from 'date-fns';
import type { Product, Company, AuditLog, User } from '@/types';
import EolStatusChart from '@/components/charts/eol-status-chart';
import { Recycle } from 'lucide-react';

const generateComplianceRateData = (products: Product[]) => {
  const data: { date: string; rate: number }[] = [];
  const sortedProducts = products.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  let verifiedCount = 0;
  sortedProducts.forEach((p, index) => {
    if (p.verificationStatus === 'Verified') {
      verifiedCount++;
    }
    const rate = Math.round((verifiedCount / (index + 1)) * 100);
    data.push({ date: format(new Date(p.createdAt), 'yyyy-MM-dd'), rate });
  });

  return data;
};

export default function BusinessAnalystAnalyticsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    const productQuery = query(
      collection(db, Collections.PRODUCTS),
      orderBy('createdAt', 'desc'),
    );
    unsubscribes.push(
      onSnapshot(productQuery, snapshot => {
        setProducts(
          snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)),
        );
        setIsLoading(false);
      }),
    );

    const userQuery = query(collection(db, Collections.USERS));
    unsubscribes.push(onSnapshot(userQuery, snapshot => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
    }));

    const companyQuery = query(collection(db, Collections.COMPANIES));
    unsubscribes.push(
      onSnapshot(companyQuery, snapshot => {
        setCompanies(
          snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company)),
        );
      }),
    );

    const auditLogQuery = query(collection(db, Collections.AUDIT_LOGS), orderBy('createdAt', 'desc'));
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

  const complianceData = {
    verified: products.filter(p => p.verificationStatus === 'Verified').length,
    pending: products.filter(p => p.verificationStatus === 'Pending').length,
    failed: products.filter(p => p.verificationStatus === 'Failed').length,
  };

  const eolData = {
    active: products.filter(
      p => p.endOfLifeStatus === 'Active' || !p.endOfLifeStatus,
    ).length,
    recycled: products.filter(p => p.endOfLifeStatus === 'Recycled').length,
    disposed: products.filter(p => p.endOfLifeStatus === 'Disposed').length,
  };

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

  const complianceRateData = generateComplianceRateData(products);
  const recentActivity = auditLogs.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Business Analytics</h1>
        <p className="text-muted-foreground">
          An overview of product and compliance trends across the platform.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
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
            <CardTitle className="text-sm font-medium">
              Total Suppliers
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
            <p className="text-xs text-muted-foreground">On the platform</p>
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
              Trusted and anchored products
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Products Recycled
            </CardTitle>
            <Recycle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eolData.recycled}</div>
            <p className="text-xs text-muted-foreground">
              Marked as end-of-life
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
            <CardTitle>Compliance Rate Over Time</CardTitle>
            <CardDescription>
              The percentage of total products that are verified.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ComplianceRateChart data={complianceRateData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Compliance Overview</CardTitle>
            <CardDescription>
              A snapshot of the current verification status across all products.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ComplianceOverviewChart data={complianceData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>End-of-Life Status</CardTitle>
            <CardDescription>
              A breakdown of the lifecycle status of all products.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EolStatusChart data={eolData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
