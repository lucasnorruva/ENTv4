// src/app/dashboard/supplier/page.tsx
import SupplierDashboard from '@/components/dashboards/supplier-dashboard';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const user = await getCurrentUser(UserRoles.SUPPLIER);
  return <SupplierDashboard user={user} />;
}
