// src/app/dashboard/admin/page.tsx
import AdminDashboard from '@/components/dashboards/admin-dashboard';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const user = await getCurrentUser(UserRoles.ADMIN);
  return <AdminDashboard user={user} />;
}
