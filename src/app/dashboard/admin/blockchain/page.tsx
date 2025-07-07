// src/app/dashboard/admin/blockchain/page.tsx
'use server';
import { redirect } from 'next/navigation';
import { getCurrentUser, getCompanies } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { UserRoles } from '@/lib/constants';
import BlockchainManagementClient from '@/components/blockchain-management-client';
import { getProducts } from '@/lib/actions';

// This page now simply acts as a server-side entry point
// for the real-time client component that handles all logic.
export default async function BlockchainManagementPage() {
  const user = await getCurrentUser(UserRoles.ADMIN);

  if (!hasRole(user, UserRoles.ADMIN)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  // Pre-fetch initial data for the client component to avoid layout shifts.
  const [initialProducts, initialCompanies] = await Promise.all([
    getProducts(user.id),
    getCompanies(),
  ]);

  return (
    <BlockchainManagementClient
      user={user}
      initialProducts={initialProducts}
      initialCompanies={initialCompanies}
    />
  );
}
