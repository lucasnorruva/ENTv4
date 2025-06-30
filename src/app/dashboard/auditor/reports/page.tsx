// src/app/dashboard/auditor/reports/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import ReportsClient from '@/components/reports-client';

export default async function ReportsPage() {
  const user = await getCurrentUser(UserRoles.AUDITOR);

  const allowedRoles = [UserRoles.AUDITOR, UserRoles.BUSINESS_ANALYST];

  if (!allowedRoles.some(role => hasRole(user, role))) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  return <ReportsClient />;
}
