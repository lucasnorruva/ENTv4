// src/app/dashboard/retailer/global-tracker/page.tsx
import { getProducts } from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import GlobalTrackerClient from '@/components/dpp-tracker/global-tracker-client';
import { MOCK_CUSTOMS_ALERTS } from '@/lib/mockCustomsAlerts';
import type { Product } from '@/types';
import { Suspense } from 'react';

export default async function RetailerGlobalTrackerPage() {
  const user = await getCurrentUser(UserRoles.RETAILER);
  const allProducts: Product[] = await getProducts(user.id); // Retailers can see all published products
  const transitProducts = allProducts.filter(
    p => p.status === 'Published' && p.transit,
  );

  // For this view, alerts can be for any product they might be tracking
  const relevantAlerts = MOCK_CUSTOMS_ALERTS.filter(a =>
    transitProducts.some(p => p.id === a.productId),
  );

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">
          Global Product Tracker
        </h1>
        <p className="text-muted-foreground">
          Track products from all suppliers across the globe.
        </p>
      </div>
      <div className="flex-1 relative">
        <Suspense>
          <GlobalTrackerClient
            products={transitProducts}
            alerts={relevantAlerts}
            user={user}
            roleSlug="retailer"
          />
        </Suspense>
      </div>
    </div>
  );
}
