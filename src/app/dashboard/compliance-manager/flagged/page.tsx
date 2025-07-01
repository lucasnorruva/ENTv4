// src/app/dashboard/compliance-manager/flagged/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser, hasRole } from '@/lib/auth';
import FlaggedProductsClient from '@/components/flagged-products-client';
import { UserRoles } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function FlaggedProductsPage() {
  const user = await getCurrentUser(UserRoles.COMPLIANCE_MANAGER);

  if (!hasRole(user, UserRoles.COMPLIANCE_MANAGER)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }
  
  // Data is now fetched on the client side.
  return <FlaggedProductsClient user={user} />;
}
