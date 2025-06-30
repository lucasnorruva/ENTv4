
// src/app/dashboard/audit/page.tsx
import { getProducts } from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import { AuditQueueClient } from '@/components/audit-queue-client';

export const dynamic = 'force-dynamic';

export default async function AuditQueuePage() {
  const user = await getCurrentUser('Auditor');
  const allProducts = await getProducts(user.id);

  const productsToAudit = allProducts.filter(
    p => p.verificationStatus === 'Pending',
  );

  return <AuditQueueClient initialProducts={productsToAudit} user={user} />;
}
