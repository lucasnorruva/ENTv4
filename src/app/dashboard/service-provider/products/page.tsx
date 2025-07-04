// src/app/dashboard/service-provider/products/page.tsx
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import ProductCatalogClient from '@/components/product-catalog-client';
import { Suspense } from 'react';

export default async function ServiceProviderProductsPage() {
  const user = await getCurrentUser(UserRoles.SERVICE_PROVIDER);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Product Catalog</h1>
        <p className="text-muted-foreground">
          Browse and search for all available product passports on the platform to view service history and manuals.
        </p>
      </div>
      <Suspense>
        <ProductCatalogClient user={user} />
      </Suspense>
    </div>
  );
}
