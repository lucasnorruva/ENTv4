import PassportDashboard from '@/components/passport-dashboard';
import { getProducts } from '@/lib/actions';

export default async function DashboardPage() {
  const initialProducts = await getProducts();

  return <PassportDashboard initialProducts={initialProducts} />;
}
