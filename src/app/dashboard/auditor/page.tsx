// src/app/dashboard/auditor/page.tsx
import AuditorDashboard from '@/components/dashboards/auditor-dashboard';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const user = await getCurrentUser(UserRoles.AUDITOR);
  return <AuditorDashboard user={user} />;
}
