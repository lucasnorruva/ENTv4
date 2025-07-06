// src/app/dashboard/admin/logs/page.tsx

import { redirect } from 'next/navigation';
import { getCurrentUser, getUsers, getCompanies } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { getAuditLogs } from '@/lib/actions/audit-actions';
import { getProducts } from '@/lib/actions/product-actions';
import { getWebhooks } from '@/lib/actions/webhook-actions';
import { UserRoles } from '@/lib/constants';
import PlatformLogsClient from '@/components/platform-logs-client';

export const dynamic = 'force-dynamic';

export default async function PlatformLogsPage() {
  const user = await getCurrentUser(UserRoles.ADMIN);

  if (!hasRole(user, UserRoles.ADMIN)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  const [logs, allUsers, allProducts, allCompanies, allWebhooks] =
    await Promise.all([
      getAuditLogs(),
      getUsers(),
      getProducts(user.id),
      getCompanies(),
      getWebhooks(),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Logs</h1>
        <p className="text-muted-foreground">
          A comprehensive audit trail of all actions taken across the system.
        </p>
      </div>
      <PlatformLogsClient
        logs={logs}
        users={allUsers}
        products={allProducts}
        companies={allCompanies}
        webhooks={allWebhooks}
      />
    </div>
  );
}
