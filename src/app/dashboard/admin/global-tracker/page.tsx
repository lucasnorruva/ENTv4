// src/app/dashboard/admin/global-tracker/page.tsx
import { getProducts } from '@/lib/actions/product-actions';
import GlobalTrackerClient from '@/components/dpp-tracker/global-tracker-client';
import { MOCK_CUSTOMS_ALERTS } from '@/lib/mockCustomsAlerts';
import type { Product } from '@/types';

export default async function GlobalTrackerPage() {
  const allProducts: Product[] = await getProducts();
  const publishedProducts = allProducts.filter(p => p.status === 'Published');

  // The client component now handles the entire page layout and interactivity.
  return (
    <GlobalTrackerClient
      products={publishedProducts}
      alerts={MOCK_CUSTOMS_ALERTS}
    />
  );
}
