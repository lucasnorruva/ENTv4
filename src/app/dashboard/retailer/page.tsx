// src/app/dashboard/retailer/page.tsx
import RetailerDashboard from '@/components/dashboards/retailer-dashboard';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const user = await getCurrentUser(UserRoles.RETAILER);
  return <RetailerDashboard user={user} />;
}
