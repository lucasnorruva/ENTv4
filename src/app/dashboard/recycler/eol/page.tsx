// src/app/dashboard/recycler/eol/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser, hasRole } from '@/lib/auth';
import EolProductsClient from '@/components/eol-products-client';
import { UserRoles } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function EolPage() {
  const user = await getCurrentUser(UserRoles.RECYCLER);

  if (!hasRole(user, UserRoles.RECYCLER)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  // Data is now fetched client-side
  return <EolProductsClient user={user} />;
}
