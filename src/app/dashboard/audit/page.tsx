// src/app/dashboard/audit/page.tsx
import { redirect } from 'next/navigation';
import { getProducts } from '@/lib/actions';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { AuditQueueClient } from '@/components/audit-queue-client';
import { UserRoles, type Role } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function AuditQueuePage({
  searchParams,
}: {
  searchParams: { role?: Role };
}) {
  const selectedRole = searchParams.role || UserRoles.SUPPLIER;
  const user = await getCurrentUser(selectedRole);

  if (!hasRole(user, UserRoles.AUDITOR)) {
    redirect('/dashboard');
  }

  const allProducts = await getProducts(user.id);

  const productsToAudit = allProducts.filter(
    p => p.verificationStatus === 'Pending',
  );

  return <AuditQueueClient initialProducts={productsToAudit} user={user} />;
}
