// src/app/dashboard/manufacturer/page.tsx
import ManufacturerDashboard from '@/components/dashboards/manufacturer-dashboard';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const user = await getCurrentUser(UserRoles.MANUFACTURER);
  return <ManufacturerDashboard user={user} />;
}
