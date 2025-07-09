
// src/app/dashboard/admin/blockchain/[id]/page.tsx
import {
  getProductById,
} from '@/lib/actions/product-actions';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import { notFound } from 'next/navigation';
import BlockchainProductDetailClient from '@/components/blockchain-product-detail-client';

export const dynamic = 'force-dynamic';

export default async function BlockchainProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser(UserRoles.ADMIN);
  const product = await getProductById(params.id, user.id);

  if (!product) {
    notFound();
  }

  return (
    <BlockchainProductDetailClient
      product={product}
      user={user}
    />
  );
}
