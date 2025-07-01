// src/app/dashboard/supplier/products/[id]/page.tsx
import { getProductById } from '@/lib/actions';
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
  const user = await getCurrentUser(UserRoles.SUPPLIER);
  const product = await getProductById(params.id, user.id);

  if (!product) {
    notFound();
  }

  return <ProductDetailView product={product} user={user} />;
}
