// src/app/dashboard/history/page.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getAuditLogsForUser, getProductById } from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import { Clock, Edit, FilePlus, FileUp, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const actionIcons: Record<string, React.ElementType> = {
  'product.created': FilePlus,
  'product.updated': Edit,
  'product.deleted': Trash2,
  'passport.submitted': FileUp,
  default: Clock,
};

export default async function HistoryPage() {
  // For this mock, we assume the current user is the default supplier
  const user = await getCurrentUser('Supplier');
  const logs = await getAuditLogsForUser(user.id);

  const getLogDetails = async (log: (typeof logs)[0]) => {
    const product = await getProductById(log.entityId);
    const Icon =
      actionIcons[log.action] ||
      actionIcons[log.action.split('.')[0]] ||
      actionIcons.default;
    let description = `Action: ${log.action}`;
    if (product) {
      description = `Product: ${product.productName}`;
    }

    return { Icon, description };
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
            <div className="absolute left-6 top-0 h-full w-px bg-border" />
            {logs.map(async (log, index) => {
              const { Icon, description } = await getLogDetails(log);
              return (
                <div key={log.id} className="relative mb-8 flex items-start">
                  <div className="absolute -left-3 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="ml-6 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{log.action}</p>
                      <p className="text-xs text-muted-foreground">
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
