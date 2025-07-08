import { getProducts } from '@/lib/actions/product-actions';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import AuditorDashboardClient from './auditor-dashboard-client';

export default async function AuditorDashboard({ user }: { user: User }) {
  const products = await getProducts(user.id);
  
  return (
    <AuditorDashboardClient user={user} products={products} />
  );
}
