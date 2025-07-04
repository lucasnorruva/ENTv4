// src/app/dashboard/developer/page.tsx
import DeveloperPortal from '@/components/dashboards/developer-dashboard';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const user = await getCurrentUser(UserRoles.DEVELOPER);
  return <DeveloperPortal user={user} />;
}
