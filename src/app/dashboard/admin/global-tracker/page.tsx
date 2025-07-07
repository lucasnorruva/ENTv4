// src/app/dashboard/admin/global-tracker/page.tsx
import { getProducts } from '@/lib/actions';
import GlobalTrackerClient from '@/components/dpp-tracker/global-tracker-client';
import { MOCK_CUSTOMS_ALERTS } from '@/lib/mockCustomsAlerts';
import type { Product, User } from '@/types';
import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';

export default async function AdminGlobalTrackerPage() {
  const user = await getCurrentUser(UserRoles.ADMIN);
  // Admins see all products on the platform
  const allProducts: Product[] = await getProducts();
  const transitProducts = allProducts.filter(
    p => p.status === 'Published' && p.transit,
  );

  // Admins see all alerts
  const relevantAlerts = MOCK_CUSTOMS_ALERTS.filter(a =>
    transitProducts.some(p => p.id === a.productId),
  );

  return (
    <Suspense>
      <GlobalTrackerClient
        products={transitProducts}
        alerts={relevantAlerts}
        user={user}
      />
    </Suspense>
  );
}
