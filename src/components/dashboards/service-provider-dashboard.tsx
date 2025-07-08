// src/components/dashboards/service-provider-dashboard.tsx
import { getProducts } from '@/lib/actions/product-actions';
import { getServiceTickets } from '@/lib/actions/ticket-actions';
import { getProductionLines } from '@/lib/actions/manufacturing-actions';
import type { User } from '@/types';
import ServiceProviderDashboardClient from './service-provider-dashboard-client';

export default async function ServiceProviderDashboard({
  user,
}: {
  user: User;
}) {
  const [products, allTickets, lines] = await Promise.all([
    getProducts(user.id),
    getServiceTickets(user.id),
    getProductionLines(),
  ]);

  const tickets = allTickets.filter(t => t.userId === user.id);

  return (
    <ServiceProviderDashboardClient
      user={user}
      products={products}
      tickets={tickets}
      lines={lines}
    />
  );
}
