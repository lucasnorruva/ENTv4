// src/app/dashboard/products/page.tsx
import ProductManagement from '@/components/product-management';
import { getProducts } from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  // We assume the logged-in user is a supplier for this page
  const user = await getCurrentUser('Supplier');
  const initialProducts = await getProducts();

  return <ProductManagement initialProducts={initialProducts} user={user} />;
}
