// src/app/dashboard/export/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { UserRoles, type Role } from '@/lib/constants';
import DataExportClient from '@/components/data-export-client';

export default async function DataExportPage({
  searchParams,
}: {
  searchParams: { role?: Role };
}) {
  const selectedRole = searchParams.role || UserRoles.SUPPLIER;
  const user = await getCurrentUser(selectedRole);

  if (!hasRole(user, UserRoles.BUSINESS_ANALYST)) {
    redirect('/dashboard');
  }

  return <DataExportClient />;
}
