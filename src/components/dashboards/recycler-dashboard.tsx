// src/components/dashboards/recycler-dashboard.tsx
import type { User } from '@/types';
import { getProducts } from '@/lib/actions/product-actions';
import RecyclerDashboardClient from './recycler-dashboard-client';

export default async function RecyclerDashboard({ user }: { user: User }) {
  const products = await getProducts(user.id);
  const stats = {
    recycled: products.filter(p => p.endOfLifeStatus === 'Recycled').length,
    active: products.filter(
      p => p.endOfLifeStatus === 'Active' || !p.endOfLifeStatus,
    ).length,
  };

  return <RecyclerDashboardClient user={user} stats={stats} />;
}
