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
  // Service providers can see all products, tickets, and lines for this mock.
  const [products, allTickets, lines] = await Promise.all([
    getProducts(),
    getServiceTickets(),
    getProductionLines(),
  ]);

  return (
    <ServiceProviderDashboardClient
      user={user}
      products={products}
      tickets={allTickets}
      lines={lines}
    />
  );
}
