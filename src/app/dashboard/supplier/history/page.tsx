// src/app/dashboard/supplier/history/page.tsx
import { redirect } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getAuditLogsForUser, getProducts } from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import {
  Clock,
  Edit,
  FilePlus,
  FileUp,
  Trash2,
  CheckCircle,
  FileX,
  Calculator,
  Recycle,
  ShieldX,
  Wrench,
} from 'lucide-react';
import type { AuditLog } from '@/types';
import { UserRoles } from '@/lib/constants';
import { formatDistanceToNow } from 'date-fns';

const actionIcons: Record<string, React.ElementType> = {
  'product.created': FilePlus,
  'product.updated': Edit,
  'product.deleted': Trash2,
  'product.recycled': Recycle,
  'product.recalculate_score': Calculator,
  'passport.submitted': FileUp,
  'passport.approved': CheckCircle,
  'passport.rejected': FileX,
  'compliance.resolved': ShieldX,
  'product.serviced': Wrench,
  default: Clock,
};

const getActionLabel = (action: string): string => {
  return action
    .split('.')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default async function HistoryPage() {
  const user = await getCurrentUser(UserRoles.SUPPLIER);

  if (!hasRole(user, UserRoles.SUPPLIER)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  const [logs, products] = await Promise.all([
    getAuditLogsForUser(user.id),
    getProducts(user.id),
  ]);

  const productMap = new Map(products.map(p => [p.id, p.productName]));

  const getLogDetails = (log: AuditLog) => {
    const Icon = actionIcons[log.action] || actionIcons.default;
    const productName = productMap.get(log.entityId);
    const description = productName
      ? `Product: ${productName}`
      : `Action: ${log.action}`;
    const label = getActionLabel(log.action);
    return { Icon, description, label };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Activity History</CardTitle>
          <CardDescription>
            A chronological log of your recent actions on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative pl-6">
            {logs.length > 0 && (
              <div className="absolute left-[35px] top-0 h-full w-px bg-border -translate-x-1/2" />
            )}
            {logs.map(log => {
              const { Icon, description, label } = getLogDetails(log);
              return (
                <div
                  key={log.id}
                  className="relative mb-8 flex items-start pl-8"
                >
                  <div className="absolute left-0 top-1 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground -translate-x-1/2">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{label}</p>
                      <p
                        className="text-xs text-muted-foreground"
                        suppressHydrationWarning
                      >
                        {formatDistanceToNow(new Date(log.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </div>
              );
            })}
            {logs.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <p>No activity history found.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
