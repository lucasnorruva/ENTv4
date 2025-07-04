// src/app/dashboard/manufacturer/products/[id]/page.tsx
import {
  getProductById,
  getCompliancePathById,
  getAuditLogsForEntity,
  getUsers,
} from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import ProductDetailView from '@/components/product-detail-view';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser(UserRoles.MANUFACTURER);
  const product = await getProductById(params.id, user.id);

  if (!product) {
    notFound();
  }

  const [compliancePath, auditLogs, allUsers] = await Promise.all([
    product.compliancePathId
      ? getCompliancePathById(product.compliancePathId)
      : undefined,
    getAuditLogsForEntity(product.id),
    getUsers(),
  ]);

  const userMap = new Map(allUsers.map(u => [u.id, u.fullName]));

  return (
    <ProductDetailView
      product={product}
      user={user}
      compliancePath={compliancePath}
      auditLogs={auditLogs}
      userMap={userMap}
    />
  );
}
