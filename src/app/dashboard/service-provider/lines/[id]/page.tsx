
// src/app/dashboard/service-provider/lines/[id]/page.tsx
import {
  getProductionLineById,
} from '@/lib/actions/manufacturing-actions';
import { getServiceTickets } from '@/lib/actions/ticket-actions';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import ProductionLineDetailView from '@/components/production-line-detail-view';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ServiceProviderLineDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser(UserRoles.SERVICE_PROVIDER);
  const line = await getProductionLineById(params.id);

  if (!line) {
    notFound();
  }

  // Fetch service tickets specifically for this production line
  const serviceHistory = await getServiceTickets(user.id, {
    productionLineId: line.id,
  });

  return (
    <ProductionLineDetailView
      line={line}
      serviceHistory={serviceHistory}
      user={user}
      roleSlug="service-provider"
    />
  );
}
