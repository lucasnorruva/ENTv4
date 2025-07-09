// src/app/dashboard/developer/webhooks/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { UserRoles } from '@/lib/constants';
import WebhookManagementClient from '@/components/webhook-management-client';
import { getWebhooks } from '@/lib/actions/webhook-actions';

export const dynamic = 'force-dynamic';

export default async function WebhooksPage() {
  const user = await getCurrentUser(UserRoles.DEVELOPER);

  if (!hasRole(user, UserRoles.DEVELOPER)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  const initialWebhooks = await getWebhooks(user.id);
  return <WebhookManagementClient user={user} initialWebhooks={initialWebhooks} />;
}
