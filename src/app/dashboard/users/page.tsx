
// src/app/dashboard/users/page.tsx
import { getUsers } from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import UserManagementClient from '@/components/user-management-client';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const [users, adminUser] = await Promise.all([
    getUsers(),
    getCurrentUser('Admin'),
  ]);

  return <UserManagementClient initialUsers={users} adminUser={adminUser} />;
}
