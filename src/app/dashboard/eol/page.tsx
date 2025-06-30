// src/app/dashboard/eol/page.tsx
import { getProducts } from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import EolProductsClient from '@/components/eol-products-client';

export const dynamic = 'force-dynamic';

export default async function EolPage() {
  const [products, user] = await Promise.all([
    getProducts(),
    getCurrentUser('Recycler'),
  ]);
  return <EolProductsClient initialProducts={products} user={user} />;
}
