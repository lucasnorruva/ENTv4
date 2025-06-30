// src/app/dashboard/service-provider/page.tsx
import ServiceProviderDashboard from '@/components/dashboards/service-provider-dashboard';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const user = await getCurrentUser(UserRoles.SERVICE_PROVIDER);
  return <ServiceProviderDashboard user={user} />;
}
