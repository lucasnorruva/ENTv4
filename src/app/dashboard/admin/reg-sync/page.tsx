// src/app/dashboard/admin/reg-sync/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { UserRoles } from '@/lib/constants';
import RegulationSyncClient from '@/components/regulation-sync-client';

export const dynamic = 'force-dynamic';

export default async function RegulationSyncPage() {
  const user = await getCurrentUser(UserRoles.ADMIN);

  if (!hasRole(user, UserRoles.ADMIN)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  // The client component will handle all data fetching and state logic
  return <RegulationSyncClient user={user} />;
}
