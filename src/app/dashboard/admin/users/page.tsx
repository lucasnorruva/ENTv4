// src/app/dashboard/admin/users/page.tsx
import { redirect } from 'next/navigation';
import { getUsers } from '@/lib/actions';
import { getCurrentUser, hasRole } from '@/lib/auth';
import UserManagementClient from '@/components/user-management-client';
import { UserRoles } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const user = await getCurrentUser(UserRoles.ADMIN);

  if (!hasRole(user, UserRoles.ADMIN)) {
    redirect(`/dashboard/admin`);
  }

  const initialUsers = await getUsers();

  return <UserManagementClient initialUsers={initialUsers} adminUser={user} />;
}