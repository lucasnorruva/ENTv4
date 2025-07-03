// src/app/dashboard/developer/webhooks/[id]/page.tsx
import { getWebhookById } from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import WebhookDeliveriesClient from '@/components/webhook-deliveries-client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

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

  return (
    <div className="space-y-4">
      <Button asChild variant="outline" size="sm">
        <Link href="/dashboard/developer/webhooks">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Webhooks
        </Link>
      </Button>
      <WebhookDeliveriesClient webhook={webhook} user={user} />
    </div>
  );
}
