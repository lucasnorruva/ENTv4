// src/app/dashboard/admin/companies/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser, getCompanies } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import CompanyManagementClient from '@/components/company-management-client';
import { UserRoles } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function CompaniesPage() {
  const user = await getCurrentUser(UserRoles.ADMIN);

  if (!hasRole(user, UserRoles.ADMIN)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  // The client component will fetch and listen to company data in real-time.
  const initialCompanies = await getCompanies();
  return <CompanyManagementClient adminUser={user} initialCompanies={initialCompanies} />;
}
