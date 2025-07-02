// src/app/dashboard/retailer/catalog/page.tsx
import ProductManagement from '@/components/product-management';
import { getCompliancePaths } from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function CatalogPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const user = await getCurrentUser(UserRoles.RETAILER);

  // Products are now fetched on the client side with a real-time listener in ProductManagement.
  const compliancePaths = await getCompliancePaths();

  return (
    <ProductManagement
      user={user}
      compliancePaths={compliancePaths}
      initialFilter={searchParams?.q}
    />
  );
}
