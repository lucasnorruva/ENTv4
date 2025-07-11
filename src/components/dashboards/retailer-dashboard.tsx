// src/components/dashboards/retailer-dashboard.tsx
import type { User } from '@/types';
import { getProducts } from '@/lib/actions/product-actions';
import RetailerDashboardClient from './retailer-dashboard-client';

export default async function RetailerDashboard({ user }: { user: User }) {
  // Retailers can see all published products
  const products = await getProducts();
  
  return <RetailerDashboardClient user={user} products={products} />;
}
