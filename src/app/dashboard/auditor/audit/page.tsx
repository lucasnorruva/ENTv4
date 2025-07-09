// src/app/dashboard/auditor/audit/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { AuditQueueClient } from '@/components/audit-queue-client';
import { UserRoles } from '@/lib/constants';
import { hasRole } from '@/lib/auth-utils';
import { getProducts } from '@/lib/actions';

export const dynamic = 'force-dynamic';

export default async function AuditQueuePage() {
  const user = await getCurrentUser(UserRoles.AUDITOR);

  if (!hasRole(user, UserRoles.AUDITOR)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }
  
  const allProducts = await getProducts(user.id);
  const pendingProducts = allProducts.filter(p => p.verificationStatus === 'Pending');

  return <AuditQueueClient user={user} initialProducts={pendingProducts} />;
}
