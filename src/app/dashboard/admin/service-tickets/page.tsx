// src/app/dashboard/admin/service-tickets/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { UserRoles } from '@/lib/constants';
import ServiceTicketManagementClient from '@/components/service-ticket-management-client';

export const dynamic = 'force-dynamic';

export default async function AdminServiceTicketsPage() {
  const user = await getCurrentUser(UserRoles.ADMIN);

  if (!hasRole(user, UserRoles.ADMIN)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  // The client component will handle fetching and real-time updates.
  return <ServiceTicketManagementClient user={user} />;
}

    