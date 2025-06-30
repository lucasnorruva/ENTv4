// src/app/dashboard/compliance/page.tsx
import { redirect } from 'next/navigation';
import { getCompliancePaths } from '@/lib/actions';
import { getCurrentUser, hasRole } from '@/lib/auth';
import CompliancePathManagement from '@/components/compliance-path-management';
import { UserRoles, type Role } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function CompliancePage({
  searchParams,
}: {
  searchParams: { role?: Role };
}) {
  const selectedRole = searchParams.role || UserRoles.SUPPLIER;
  const user = await getCurrentUser(selectedRole);

  const allowedRoles: Role[] = [
    UserRoles.ADMIN,
    UserRoles.AUDITOR,
    UserRoles.COMPLIANCE_MANAGER,
  ];

  if (!allowedRoles.some(role => hasRole(user, role))) {
    redirect('/dashboard');
  }

  const initialPaths = await getCompliancePaths();

  return (
    <CompliancePathManagement
      initialCompliancePaths={initialPaths}
      user={user}
    />
  );
}
