
// src/app/dashboard/business-analyst/export/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { UserRoles } from '@/lib/constants';
import DataExportClient from '@/components/data-export-client';

export default async function DataExportPage() {
  const user = await getCurrentUser(UserRoles.BUSINESS_ANALYST);

  if (!hasRole(user, UserRoles.BUSINESS_ANALYST)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  return <DataExportClient />;
}
