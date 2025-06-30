// src/app/dashboard/companies/page.tsx
import { redirect } from 'next/navigation';
import { getCompanies } from '@/lib/actions';
import { getCurrentUser, hasRole } from '@/lib/auth';
import CompanyManagementClient from '@/components/company-management-client';
import { UserRoles, type Role } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: { role?: Role };
}) {
  const selectedRole = searchParams.role || UserRoles.SUPPLIER;
  const user = await getCurrentUser(selectedRole);

  if (!hasRole(user, UserRoles.ADMIN)) {
    redirect('/dashboard');
  }

  const initialCompanies = await getCompanies();

  return (
    <CompanyManagementClient
      initialCompanies={initialCompanies}
      adminUser={user}
    />
  );
}
