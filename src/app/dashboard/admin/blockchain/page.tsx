// src/app/dashboard/admin/blockchain/page.tsx
'use server';
import { redirect } from 'next/navigation';
import { getCurrentUser, getCompanies } from '@/lib/auth';
import { getProducts } from '@/lib/actions';
import { hasRole } from '@/lib/auth-utils';
import { UserRoles } from '@/lib/constants';
import BlockchainManagementClient from '@/components/blockchain-management-client';

// This page now acts as a server-side entry point
// for the real-time client component that handles all logic.
export default async function TrustHubPage() {
  const user = await getCurrentUser(UserRoles.ADMIN);

  if (!hasRole(user, UserRoles.ADMIN)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  // Fetch the initial data on the server
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
