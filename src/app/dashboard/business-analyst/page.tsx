// src/app/dashboard/business-analyst/page.tsx
import BusinessAnalystDashboard from '@/components/dashboards/business-analyst-dashboard';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const user = await getCurrentUser(UserRoles.BUSINESS_ANALYST);
  return <BusinessAnalystDashboard user={user} />;
}
