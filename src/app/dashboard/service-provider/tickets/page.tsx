// src/app/dashboard/service-provider/tickets/page.tsx
import ServiceTicketManagementClient from '@/components/service-ticket-management-client';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function ServiceTicketsPage() {
  const user = await getCurrentUser(UserRoles.SERVICE_PROVIDER);
  return <ServiceTicketManagementClient user={user} />;
}
