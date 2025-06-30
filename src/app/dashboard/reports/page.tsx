// src/app/dashboard/reports/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { UserRoles, type Role } from '@/lib/constants';
import ReportsClient from '@/components/reports-client';

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { role?: Role };
}) {
  const selectedRole = searchParams.role || UserRoles.SUPPLIER;
  const user = await getCurrentUser(selectedRole);

  const allowedRoles: Role[] = [
    UserRoles.AUDITOR,
    UserRoles.BUSINESS_ANALYST,
  ];

  if (!allowedRoles.some(role => hasRole(user, role))) {
    redirect('/dashboard');
  }

  return <ReportsClient />;
}
