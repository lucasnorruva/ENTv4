
// src/app/dashboard/manufacturer/global-tracker/page.tsx
import { getProducts } from '@/lib/actions/product-actions';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import GlobalTrackerClient from '@/components/dpp-tracker/global-tracker-client';
import { MOCK_CUSTOMS_ALERTS } from '@/lib/mockCustomsAlerts';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getProductionLines } from '@/lib/actions/manufacturing-actions';

export default async function ManufacturerGlobalTrackerPage() {
  // Get current user to filter products by their company
  const user = await getCurrentUser(UserRoles.MANUFACTURER);
  
  const [companyProducts, allProductionLines] = await Promise.all([
    getProducts(user.id),
    getProductionLines(),
  ]);

  // Filter for products that are actually in transit
  const transitProducts = companyProducts.filter(
    p => p.status === 'Published' && p.transit,
  );

  const companyProductionLines = allProductionLines.filter(
    line => line.companyId === user.companyId
  );

  // For this view, filter alerts related to the company's products
  const companyProductIds = new Set(companyProducts.map(p => p.id));
  const companyAlerts = MOCK_CUSTOMS_ALERTS.filter(a =>
    companyProductIds.has(a.productId),
  );

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">
          My Supply Chain Tracker
        </h1>
        <p className="text-muted-foreground">
          Monitor your products&apos; transit routes and customs status.
        </p>
      </div>
      <div className="flex-1 relative">
        <Suspense fallback={<div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
          <GlobalTrackerClient
            products={companyProducts}
            alerts={companyAlerts}
            productionLines={companyProductionLines}
            user={user}
            roleSlug="manufacturer"
          />
        </Suspense>
      </div>
    </div>
  );
}
