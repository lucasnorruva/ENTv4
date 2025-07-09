// src/app/dashboard/service-provider/lines/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { UserRoles } from '@/lib/constants';
import ProductionLineManagementClient from '@/components/production-line-management-client';

export const dynamic = 'force-dynamic';

export default async function ServiceProviderLinesPage() {
  const user = await getCurrentUser(UserRoles.SERVICE_PROVIDER);

  if (!hasRole(user, UserRoles.SERVICE_PROVIDER)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  // The client component will handle fetching and displaying the data.
  // Permissions inside the component will prevent editing/deleting.
  return <ProductionLineManagementClient user={user} />;
}
