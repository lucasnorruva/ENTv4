// src/app/dashboard/manufacturer/tickets/page.tsx
import ServiceTicketManagementClient from '@/components/service-ticket-management-client';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function ManufacturerServiceTicketsPage() {
  const user = await getCurrentUser(UserRoles.MANUFACTURER);
  return <ServiceTicketManagementClient user={user} />;
}
