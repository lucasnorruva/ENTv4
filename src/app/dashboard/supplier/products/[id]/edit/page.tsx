// src/app/dashboard/supplier/products/[id]/edit/page.tsx
import {
    getProductById,
    getCompliancePaths,
  } from '@/lib/actions';
  import { getCurrentUser } from '@/lib/auth';
  import { UserRoles } from '@/lib/constants';
  import ProductEditView from '@/components/product-edit-view';
  import { notFound } from 'next/navigation';
  
  export const dynamic = 'force-dynamic';
  
  export default async function ProductEditPage({
    params,
  }: {
    params: { id: string };
  }) {
    const user = await getCurrentUser(UserRoles.SUPPLIER);
    const [product, compliancePaths] = await Promise.all([
      getProductById(params.id, user.id),
      getCompliancePaths(),
    ]);
  
    if (!product) {
      notFound();
    }
    
    return (
      <ProductEditView
        product={product}
        user={user}
        compliancePaths={compliancePaths}
      />
    );
  }
  
