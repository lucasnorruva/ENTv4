// src/app/dashboard/admin/companies/page.tsx
import { redirect } from 'next/navigation';
import { getCompanies } from '@/lib/actions';
import { getCurrentUser, hasRole } from '@/lib/auth';
import CompanyManagementClient from '@/components/company-management-client';
import { UserRoles } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function CompaniesPage() {
  const user = await getCurrentUser(UserRoles.ADMIN);

  if (!hasRole(user, UserRoles.ADMIN)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  const initialCompanies = await getCompanies();

  return (
    <CompanyManagementClient
      initialCompanies={initialCompanies}
      adminUser={user}
    />
  );
}
