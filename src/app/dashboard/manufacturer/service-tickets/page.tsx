// src/app/dashboard/manufacturer/service-tickets/page.tsx
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import ServiceTicketManagementClient from '@/components/service-ticket-management-client';

export const dynamic = 'force-dynamic';

export default async function ManufacturerServiceTicketsPage() {
  const user = await getCurrentUser(UserRoles.MANUFACTURER);
  return <ServiceTicketManagementClient user={user} />;
}
