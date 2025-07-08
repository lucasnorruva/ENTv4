// src/components/dashboards/manufacturer-dashboard.tsx
import { getProducts } from '@/lib/actions/product-actions';
import { getProductionLines } from '@/lib/actions/manufacturing-actions';
import type { User } from '@/types';
import ManufacturerDashboardClient from './manufacturer-dashboard-client';

export default async function ManufacturerDashboard({ user }: { user: User }) {
  const [products, lines] = await Promise.all([
    getProducts(user.id),
    getProductionLines(),
  ]);

  return (
    <ManufacturerDashboardClient user={user} products={products} lines={lines} />
  );
}
