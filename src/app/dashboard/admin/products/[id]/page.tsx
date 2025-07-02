// src/app/dashboard/admin/products/[id]/page.tsx
import {
  getProductById,
  getCompliancePathById,
  getAuditLogsForEntity,
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
  // Use a role that has global access for fetching the product
  const user = await getCurrentUser(UserRoles.ADMIN);
  const product = await getProductById(params.id, user.id);

  if (!product) {
    notFound();
  }

  const [compliancePath, auditLogs] = await Promise.all([
    product.compliancePathId
      ? getCompliancePathById(product.compliancePathId)
      : undefined,
    getAuditLogsForEntity(product.id),
  ]);

  return (
    <ProductDetailView
      product={product}
      user={user}
      compliancePath={compliancePath}
      auditLogs={auditLogs}
    />
  );
}
