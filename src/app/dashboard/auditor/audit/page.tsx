// src/app/dashboard/auditor/audit/page.tsx
import { redirect } from 'next/navigation';
import { getProducts } from '@/lib/actions';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { AuditQueueClient } from '@/components/audit-queue-client';
import { UserRoles } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function AuditQueuePage() {
  const user = await getCurrentUser(UserRoles.AUDITOR);

  if (!hasRole(user, UserRoles.AUDITOR)) {
    redirect(`/dashboard/auditor`);
  }

  const allProducts = await getProducts(user.id);

  const productsToAudit = allProducts.filter(
    p => p.verificationStatus === 'Pending',
  );

  return <AuditQueueClient initialProducts={productsToAudit} user={user} />;
}