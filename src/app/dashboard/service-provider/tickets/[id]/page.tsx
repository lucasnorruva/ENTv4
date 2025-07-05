
// src/app/dashboard/service-provider/tickets/[id]/page.tsx
import {
  getServiceTicketById,
  getProducts,
  getProductionLines,
} from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import ServiceTicketDetailView from '@/components/service-ticket-detail-view';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ServiceTicketDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser(UserRoles.SERVICE_PROVIDER);
  const ticket = await getServiceTicketById(params.id, user.id);

  if (!ticket) {
    notFound();
  }

  const [products, lines] = await Promise.all([
    getProducts(user.id),
    getProductionLines(),
  ]);

  return (
    <ServiceTicketDetailView
      ticket={ticket}
      user={user}
      roleSlug="service-provider"
      products={products}
      productionLines={lines}
    />
  );
}
