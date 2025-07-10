// src/app/dashboard/compliance-manager/flagged/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import FlaggedProductsClient from '@/components/flagged-products-client';
import { UserRoles } from '@/lib/constants';
import { hasRole } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export default async function FlaggedProductsPage() {
  const user = await getCurrentUser(UserRoles.COMPLIANCE_MANAGER);

  if (!hasRole(user, UserRoles.COMPLIANCE_MANAGER)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }
  
  // Data is now fetched client-side with a real-time listener.
  return <FlaggedProductsClient user={user} />;
}
