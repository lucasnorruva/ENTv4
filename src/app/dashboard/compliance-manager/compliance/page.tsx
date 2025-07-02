// src/app/dashboard/compliance-manager/compliance/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import CompliancePathManagement from '@/components/compliance-path-management';
import { UserRoles } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function CompliancePage() {
  const user = await getCurrentUser(UserRoles.COMPLIANCE_MANAGER);

  const allowedRoles = [
    UserRoles.ADMIN,
    UserRoles.AUDITOR,
    UserRoles.COMPLIANCE_MANAGER,
  ];

  if (!allowedRoles.some(role => hasRole(user, role))) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  return <CompliancePathManagement user={user} />;
}
