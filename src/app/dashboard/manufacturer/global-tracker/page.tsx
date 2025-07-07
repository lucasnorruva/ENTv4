// src/app/dashboard/manufacturer/global-tracker/page.tsx
import { getProducts } from '@/lib/actions/product-actions';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import GlobalTrackerClient from '@/components/dpp-tracker/global-tracker-client';
import { MOCK_CUSTOMS_ALERTS } from '@/lib/mockCustomsAlerts';
import type { Product } from '@/types';

export default async function ManufacturerGlobalTrackerPage() {
  // Get current user to filter products by their company
  const user = await getCurrentUser(UserRoles.MANUFACTURER);
  const companyProducts: Product[] = await getProducts(user.id);

  // Filter for products that are actually in transit
  const transitProducts = companyProducts.filter(
    p => p.status === 'Published' && p.transit,
  );

  // For this view, filter alerts related to the company's products
  const companyProductIds = new Set(companyProducts.map(p => p.id));
  const companyAlerts = MOCK_CUSTOMS_ALERTS.filter(a =>
    companyProductIds.has(a.productId),
  );

  return (
    <GlobalTrackerClient products={transitProducts} alerts={companyAlerts} />
  );
}
