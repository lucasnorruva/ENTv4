// src/app/dashboard/retailer/global-tracker/page.tsx
import { getProducts } from '@/lib/actions';
import GlobalTrackerClient from '@/components/dpp-tracker/global-tracker-client';
import { MOCK_CUSTOMS_ALERTS } from '@/lib/mockCustomsAlerts';
import type { Product } from '@/types';

export default async function RetailerGlobalTrackerPage() {
  const allProducts: Product[] = await getProducts(); // Retailers can see all published products
  const transitProducts = allProducts.filter(p => p.status === 'Published' && p.transit);

  // For this view, alerts can be for any product they might be tracking
  const relevantAlerts = MOCK_CUSTOMS_ALERTS.filter(a => transitProducts.some(p => p.id === a.productId));

  return (
    <GlobalTrackerClient
      products={transitProducts}
      alerts={relevantAlerts}
    />
  );
}
