// src/app/dashboard/supplier/products/new/page.tsx
import ProductForm from '@/components/product-form';
import { getCurrentUser } from '@/lib/auth';
import { getCompliancePaths } from '@/lib/actions';
import { UserRoles } from '@/lib/constants';

export default async function NewProductPage() {
  const user = await getCurrentUser(UserRoles.SUPPLIER);
  const compliancePaths = await getCompliancePaths();

  return (
    <ProductForm
      user={user}
      compliancePaths={compliancePaths}
      roleSlug="supplier"
    />
  );
}
