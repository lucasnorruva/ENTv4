// src/app/dashboard/recycler/credits/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getAuditLogsForUser } from '@/lib/actions';
import { UserRoles } from '@/lib/constants';
import { hasRole } from '@/lib/auth-utils';
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
import { Award } from 'lucide-react';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function RecyclerCreditsPage() {
  const user = await getCurrentUser(UserRoles.RECYCLER);
  if (!hasRole(user, UserRoles.RECYCLER)) {
    redirect('/dashboard');
  }

  const logs = await getAuditLogsForUser(user.id);
  const creditLogs = logs.filter(log => log.action === 'credits.minted');

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Your Credit Balance
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {user.circularityCredits ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Credits earned from recycling activities.
            </p>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>About Circularity Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Circularity Credits are awarded for processing end-of-life
              products, verifying your contribution to the circular economy.
              These credits can be used to offset sustainability targets or
              participate in mass balance accounting systems.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Credit Transaction History</CardTitle>
          <CardDescription>
            A log of all circularity credits you have earned.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Related Product ID</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creditLogs.length > 0 ? (
                creditLogs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {format(new Date(log.createdAt), 'PPP')}
                    </TableCell>
                    <TableCell className="font-medium">
                      Product Recycled
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.entityId}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="default" className="bg-green-600">
                        + {log.details.amount} Credits
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No credit transactions found. Recycle a product to get
                    started!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
