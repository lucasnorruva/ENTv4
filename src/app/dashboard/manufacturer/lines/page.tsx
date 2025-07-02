// src/app/dashboard/manufacturer/lines/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { UserRoles } from '@/lib/constants';
import ProductionLineManagementClient from '@/components/production-line-management-client';

export const dynamic = 'force-dynamic';

export default async function ProductionLinesPage() {
  const user = await getCurrentUser(UserRoles.MANUFACTURER);

  if (!hasRole(user, UserRoles.MANUFACTURER)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  // The client component now handles fetching and displaying the data.
  return <ProductionLineManagementClient user={user} />;
}
