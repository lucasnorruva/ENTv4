// src/app/dashboard/recycler/page.tsx
import RecyclerDashboard from '@/components/dashboards/recycler-dashboard';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const user = await getCurrentUser(UserRoles.RECYCLER);
  return <RecyclerDashboard user={user} />;
}
