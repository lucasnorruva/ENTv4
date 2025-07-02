// src/app/dashboard/developer/webhooks/[id]/page.tsx
import { getWebhookById, getAuditLogsForEntity } from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import WebhookDeliveriesClient from '@/components/webhook-deliveries-client';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function WebhookDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser(UserRoles.DEVELOPER);
  const webhook = await getWebhookById(params.id, user.id);

  if (!webhook) {
    notFound();
  }

  const deliveryLogs = (await getAuditLogsForEntity(webhook.id)).filter(log =>
    log.action.startsWith('webhook.delivery'),
  );

  return (
    <WebhookDeliveriesClient
      webhook={webhook}
      initialLogs={deliveryLogs}
      user={user}
    />
  );
}
