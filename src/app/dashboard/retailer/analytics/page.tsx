// src/app/dashboard/retailer/analytics/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Removed unused 'orderBy' import
import { Collections } from '@/lib/constants';
import type { Product } from '@/types';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Package, ShieldCheck, Award, TrendingUp, Loader2 } from 'lucide-react';
import ComplianceOverviewChart from '@/components/charts/compliance-overview-chart';
import SustainabilityByCategoryChart from '@/components/charts/sustainability-by-category-chart';
import EsgBySupplierChart from '@/components/charts/esg-by-supplier-chart';

const aggregateScoresByCategory = (products: Product[]) => {
  const categoryScores: Record<string, { totalScore: number; count: number }> =
    {};
  products.forEach(product => {
    if (product.sustainability?.score !== undefined) {
      if (!categoryScores[product.category]) {
        categoryScores[product.category] = { totalScore: 0, count: 0 };
      }
      categoryScores[product.category].totalScore +=
        product.sustainability.score;
      categoryScores[product.category].count++;
    }
  });
  return Object.entries(categoryScores).map(([category, data]) => ({
    category,
    averageScore:
      data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
  }));
};

const aggregateScoresBySupplier = (products: Product[]) => {
  const supplierScores: Record<string, { totalScore: number; count: number }> =
    {};
  products.forEach(product => {
    if (product.sustainability?.score !== undefined) {
      if (!supplierScores[product.supplier]) {
        supplierScores[product.supplier] = { totalScore: 0, count: 0 };
      }
      supplierScores[product.supplier].totalScore +=
        product.sustainability.score;
      supplierScores[product.supplier].count++;
    }
  });
  return Object.entries(supplierScores).map(([supplier, data]) => ({
    supplier,
    averageScore:
      data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
  }));
};

export default function RetailerAnalyticsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, Collections.PRODUCTS), where('status', '==', 'Published'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const publishedProducts = products; // Already filtered by query
  const scoredProducts = publishedProducts.filter(
    p => p.sustainability?.score !== undefined,
  );

  const stats = {
    totalProducts: publishedProducts.length,
    complianceRate:
      publishedProducts.length > 0
        ? Math.round(
            (publishedProducts.filter(p => p.verificationStatus === 'Verified')
              .length /
              publishedProducts.length) *
              100,
          )
        : 0,
    averageEsg:
      scoredProducts.length > 0
        ? Math.round(
            scoredProducts.reduce(
              (sum, p) => sum + p.sustainability!.score,
              0,
            ) / scoredProducts.length,
          )
        : 0,
  };

  const complianceData = {
    verified: publishedProducts.filter(p => p.verificationStatus === 'Verified')
      .length,
    pending: publishedProducts.filter(p => p.verificationStatus === 'Pending')
      .length,
    failed: publishedProducts.filter(p => p.verificationStatus === 'Failed')
      .length,
  };

  const sustainabilityByCategoryData =
    aggregateScoresByCategory(scoredProducts);
  const esgBySupplierData = aggregateScoresBySupplier(scoredProducts).sort(
    (a, b) => b.averageScore - a.averageScore,
  );

  const topSupplier = esgBySupplierData.length > 0 ? esgBySupplierData[0] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Supplier & Product Analytics
        </h1>
        <p className="text-muted-foreground">
          Analyze product trends to inform your purchasing and retail strategy.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Published passports in the catalog
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Compliance Rate
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.complianceRate}%</div>
            <p className="text-xs text-muted-foreground">
              Of all published products are verified
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average ESG Score
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageEsg} / 100</div>
            <p className="text-xs text-muted-foreground">
              Across all scored products
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Supplier</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {topSupplier ? topSupplier.supplier : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {topSupplier
                ? `Avg. ESG Score: ${topSupplier.averageScore}`
                : 'No scored suppliers'}
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Average ESG Score by Supplier</CardTitle>
            <CardDescription>
              Compare the sustainability performance of different suppliers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EsgBySupplierChart data={esgBySupplierData.slice(0, 10)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Compliance Overview</CardTitle>
            <CardDescription>
              A breakdown of verification status for all available products.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ComplianceOverviewChart data={complianceData} />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Average ESG Score by Category</CardTitle>
          <CardDescription>
            Identify which product categories have the strongest sustainability
            profiles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SustainabilityByCategoryChart data={sustainabilityByCategoryData} />
        </CardContent>
      </Card>
    </div>
  );
}
