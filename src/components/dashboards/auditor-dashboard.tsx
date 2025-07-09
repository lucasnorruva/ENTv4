// src/components/dashboards/auditor-dashboard.tsx
import { getProducts } from '@/lib/actions/product-actions';
import type { User } from '@/types';
import AuditorDashboardClient from './auditor-dashboard-client';

export default async function AuditorDashboard({ user }: { user: User }) {
  const products = await getProducts(user.id);
  
  return (
    <AuditorDashboardClient user={user} products={products} />
  );
}
