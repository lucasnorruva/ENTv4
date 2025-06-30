// src/app/dashboard/users/page.tsx
import { redirect } from 'next/navigation';
import { getUsers } from '@/lib/actions';
import { getCurrentUser, hasRole } from '@/lib/auth';
import UserManagementClient from '@/components/user-management-client';
import { UserRoles, type Role } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { role?: Role };
}) {
  const selectedRole = searchParams.role || UserRoles.SUPPLIER;
  const user = await getCurrentUser(selectedRole);

  if (!hasRole(user, UserRoles.ADMIN)) {
    redirect('/dashboard');
  }

  const initialUsers = await getUsers();

  return <UserManagementClient initialUsers={initialUsers} adminUser={user} />;
}
