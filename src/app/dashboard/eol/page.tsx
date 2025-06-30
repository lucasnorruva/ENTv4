
// src/app/dashboard/eol/page.tsx
import { getProducts } from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import EolProductsClient from '@/components/eol-products-client';

export const dynamic = 'force-dynamic';

export default async function EolPage() {
  const user = await getCurrentUser('Recycler');
  const products = await getProducts(user.id);
  return <EolProductsClient initialProducts={products} user={user} />;
}
