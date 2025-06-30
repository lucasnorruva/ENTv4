// src/app/dashboard/compliance-manager/page.tsx
import ComplianceManagerDashboard from '@/components/dashboards/compliance-manager-dashboard';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const user = await getCurrentUser(UserRoles.COMPLIANCE_MANAGER);
  return <ComplianceManagerDashboard user={user} />;
}
