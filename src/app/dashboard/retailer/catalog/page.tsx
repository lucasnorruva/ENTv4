// src/app/dashboard/retailer/catalog/page.tsx
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import ProductCatalogClient from '@/components/product-catalog-client';
import { Suspense } from 'react';

export default async function CatalogPage() {
  const user = await getCurrentUser(UserRoles.RETAILER);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Product Catalog</h1>
        <p className="text-muted-foreground">
          Browse and search for all available product passports on the platform.
        </p>
      </div>
      <Suspense>
        <ProductCatalogClient user={user} />
      </Suspense>
    </div>
  );
}
