// src/app/dashboard/auditor/compliance/page.tsx
import { redirect } from 'next/navigation';
import { getCompliancePaths } from '@/lib/actions';
import { getCurrentUser, hasRole } from '@/lib/auth';
import CompliancePathManagement from '@/components/compliance-path-management';
import { UserRoles } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function CompliancePage() {
  const user = await getCurrentUser(UserRoles.AUDITOR);

  const allowedRoles = [
    UserRoles.ADMIN,
    UserRoles.AUDITOR,
    UserRoles.COMPLIANCE_MANAGER,
  ];

  if (!allowedRoles.some(role => hasRole(user, role))) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  const initialPaths = await getCompliancePaths();

  return (
    <CompliancePathManagement
      initialCompliancePaths={initialPaths}
      user={user}
    />
  );
}