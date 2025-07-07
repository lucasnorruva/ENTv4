// src/app/dashboard/admin/blockchain/page.tsx
'use server';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { UserRoles } from '@/lib/constants';
import BlockchainManagementClient from '@/components/blockchain-management-client';

export const dynamic = 'force-dynamic';

export default async function BlockchainManagementPage() {
  const user = await getCurrentUser(UserRoles.ADMIN);

  if (!hasRole(user, UserRoles.ADMIN)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  // The client component will handle fetching and filtering the data.
  return <BlockchainManagementClient user={user} />;
}
