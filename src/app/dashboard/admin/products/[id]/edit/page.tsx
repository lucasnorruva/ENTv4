// src/app/dashboard/admin/products/[id]/edit/page.tsx
import {
  getProductById,
  getCompliancePaths,
} from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import ProductForm from '@/components/product-form';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProductEditPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser(UserRoles.ADMIN);
  const [product, compliancePaths] = await Promise.all([
    getProductById(params.id, user.id),
    getCompliancePaths(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <ProductForm
      initialData={product}
      user={user}
      compliancePaths={compliancePaths}
      roleSlug="admin"
    />
  );
}
