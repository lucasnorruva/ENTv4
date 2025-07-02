// src/app/dashboard/developer/webhooks/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import WebhookManagementClient from '@/components/webhook-management-client';

export const dynamic = 'force-dynamic';

export default async function WebhooksPage() {
  const user = await getCurrentUser(UserRoles.DEVELOPER);

  if (!hasRole(user, UserRoles.DEVELOPER)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  // Webhooks are now fetched on the client side
  return <WebhookManagementClient user={user} />;
}
