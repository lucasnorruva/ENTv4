
// src/app/dashboard/auditor/reports/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { UserRoles } from '@/lib/constants';
import DataExportClient from '@/components/data-export-client';

export default async function ReportsPage() {
  const user = await getCurrentUser(UserRoles.AUDITOR);

  const allowedRoles = [
    UserRoles.AUDITOR,
    UserRoles.BUSINESS_ANALYST,
    UserRoles.COMPLIANCE_MANAGER,
    UserRoles.ADMIN,
  ];

  if (!allowedRoles.some(role => hasRole(user, role))) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  return <DataExportClient />;
}
