// src/app/dashboard/compliance-manager/flagged/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import FlaggedProductsClient from '@/components/flagged-products-client';
import { UserRoles } from '@/lib/constants';
import { hasRole } from '@/lib/auth-utils';
import { getProducts } from '@/lib/actions';

export const dynamic = 'force-dynamic';

export default async function FlaggedProductsPage() {
  const user = await getCurrentUser(UserRoles.COMPLIANCE_MANAGER);

  if (!hasRole(user, UserRoles.COMPLIANCE_MANAGER)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }
  
  const allProducts = await getProducts(user.id);
  const flaggedProducts = allProducts.filter(p => p.verificationStatus === 'Failed');
  
  return <FlaggedProductsClient user={user} initialProducts={flaggedProducts} />;
}
