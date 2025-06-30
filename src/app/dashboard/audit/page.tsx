// src/app/dashboard/audit/page.tsx
import { getProducts } from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import { AuditQueueClient } from '@/components/audit-queue-client';

export const dynamic = 'force-dynamic';

export default async function AuditQueuePage() {
  const [products, user] = await Promise.all([
    getProducts(),
    getCurrentUser('Auditor'),
  ]);

  return <AuditQueueClient initialProducts={products} user={user} />;
}
