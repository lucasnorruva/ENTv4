
import { getProducts } from '@/lib/actions';
import GlobalTrackerClient from '@/components/dpp-tracker/global-tracker-client';
import { MOCK_CUSTOMS_ALERTS } from '@/lib/mockCustomsAlerts';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import { Loader2 } from 'lucide-react';
import { getProductionLines } from '@/lib/actions/manufacturing-actions';
import { Suspense } from 'react';

export default async function AdminGlobalTrackerPage() {
  const user = await getCurrentUser(UserRoles.ADMIN);
  // Admins see all products on the platform
  const [allProducts, allProductionLines] = await Promise.all([
    getProducts(user.id),
    getProductionLines(),
  ]);

  const transitProducts = allProducts.filter(
    p => p.status === 'Published' && p.transit,
  );

  // Admins see all alerts
  const relevantAlerts = MOCK_CUSTOMS_ALERTS.filter(a =>
    transitProducts.some(p => p.id === a.productId),
  );

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">
          Global Supply Chain Tracker
        </h1>
        <p className="text-muted-foreground">
          Monitor product transit, supply chain routes, and customs alerts in
          real-time.
        </p>
      </div>
      <div className="flex-1 relative">
        <Suspense fallback={<div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
          <GlobalTrackerClient
            products={allProducts}
            alerts={relevantAlerts}
            productionLines={allProductionLines}
            user={user}
            roleSlug="admin"
          />
        </Suspense>
      </div>
    </div>
  );
}
