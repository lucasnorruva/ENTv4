// src/app/dashboard/developer/logs/page.tsx
import { redirect } from 'next/navigation';
import { getAuditLogs } from '@/lib/actions';
import { getCurrentUser, hasRole } from '@/lib/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { UserRoles } from '@/lib/constants';

export default async function ApiLogsPage() {
  const user = await getCurrentUser(UserRoles.DEVELOPER);

  if (!hasRole(user, UserRoles.DEVELOPER)) {
    redirect(`/dashboard/developer`);
  }

  const allLogs = await getAuditLogs();
  const apiLogs = allLogs.filter(log => log.action.startsWith('api.'));

  const getStatusVariant = (status: number) => {
    if (status >= 500) return 'destructive';
    if (status >= 400) return 'secondary';
    return 'default';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Logs</CardTitle>
        <CardDescription>
          A log of the most recent requests made to the Norruva API using your
          keys.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Endpoint</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>User ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiLogs.map(log => (
              <TableRow key={log.id}>
                <TableCell>
                  {format(new Date(log.createdAt), 'PPpp')}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      log.details.method === 'POST' ? 'outline' : 'secondary'
                    }
                  >
                    {log.details.method}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {log.details.endpoint}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(log.details.status)}>
                    {log.details.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {log.userId}
                </TableCell>
              </TableRow>
            ))}
            {apiLogs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No API requests have been logged yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}