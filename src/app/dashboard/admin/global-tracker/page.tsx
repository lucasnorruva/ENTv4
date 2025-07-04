// src/app/dashboard/admin/global-tracker/page.tsx
import { getProducts } from '@/lib/actions';
import GlobalTrackerClient from '@/components/dpp-tracker/global-tracker-client';
import { MOCK_CUSTOMS_ALERTS } from '@/lib/mockCustomsAlerts';
import type { Product } from '@/types';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
  } from '@/components/ui/card';
  

export default async function GlobalTrackerPage() {
  const allProducts: Product[] = await getProducts();
  const publishedProducts = allProducts.filter(p => p.status === 'Published');
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <GlobalTrackerClient
        products={publishedProducts}
        alerts={MOCK_CUSTOMS_ALERTS}
      />
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Future Widget Area</CardTitle>
            <CardDescription>
              This space can be used for detailed analytics, event logs, or
              other related components.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48 bg-muted rounded-md">
              <p className="text-muted-foreground">Widget placeholder</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
