// src/app/dashboard/retailer/analytics/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import AnalyticsPage from '../../admin/analytics/page';

export default async function RetailerAnalyticsPage() {
  const user = await getCurrentUser(UserRoles.RETAILER);

  if (!hasRole(user, UserRoles.RETAILER) && !hasRole(user, UserRoles.ADMIN)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  return <AnalyticsPage />;
}
