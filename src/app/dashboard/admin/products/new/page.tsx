// src/app/dashboard/admin/products/new/page.tsx
import ProductForm from '@/components/product-form';
import { getCurrentUser } from '@/lib/auth';
import { getCompliancePaths } from '@/lib/actions/compliance-actions';
import { UserRoles } from '@/lib/constants';

export default async function NewProductPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const user = await getCurrentUser(UserRoles.ADMIN);
  const compliancePaths = await getCompliancePaths();

  const initialDataFromAI =
    searchParams && Object.keys(searchParams).length > 0
      ? {
          productName: searchParams.productName as string,
          productDescription: searchParams.productDescription as string,
          category: searchParams.category as 'Electronics' | 'Fashion' | 'Home Goods' | 'Construction' | 'Food & Beverage',
        }
      : undefined;

  return (
    <ProductForm
      user={user}
      compliancePaths={compliancePaths}
      roleSlug="admin"
      initialData={initialDataFromAI}
    />
  );
}
