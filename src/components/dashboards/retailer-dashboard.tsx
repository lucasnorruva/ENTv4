import type { User } from '@/types';
import { getProducts } from '@/lib/actions/product-actions';
import RetailerDashboardClient from './retailer-dashboard-client';

export default async function RetailerDashboard({ user }: { user: User }) {
  const products = await getProducts(user.id);
  
  return <RetailerDashboardClient user={user} products={products} />;
}
