// src/app/dashboard/admin/users/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser, getCompanies, getUsers } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import UserManagementClient from '@/components/user-management-client';
import { UserRoles } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const user = await getCurrentUser(UserRoles.ADMIN);

  if (!hasRole(user, UserRoles.ADMIN)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  const [initialUsers, initialCompanies] = await Promise.all([
    getUsers(),
    getCompanies(),
  ]);

  return (
    <UserManagementClient
      adminUser={user}
      initialUsers={initialUsers}
      initialCompanies={initialCompanies}
    />
  );
}
