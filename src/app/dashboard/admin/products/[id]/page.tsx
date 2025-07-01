// src/app/dashboard/admin/products/[id]/page.tsx
import { getProductById, getCompliancePathById } from '@/lib/actions';
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

  const compliancePath = product.compliancePathId
    ? await getCompliancePathById(product.compliancePathId)
    : undefined;

  return (
    <ProductDetailView
      product={product}
      user={user}
      compliancePath={compliancePath}
    />
  );
}
