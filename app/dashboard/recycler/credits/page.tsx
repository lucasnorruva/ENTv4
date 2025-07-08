
// src/app/dashboard/recycler/credits/page.tsx
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
import { getAuditLogsForUser } from '@/lib/actions/audit-actions';
import { getProducts } from '@/lib/actions/product-actions';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import { Award, Package } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CreditHistoryPage() {
  const user = await getCurrentUser(UserRoles.RECYCLER);
  const [logs, products] = await Promise.all([
    getAuditLogsForUser(user.id),
    getProducts(user.id),
  ]);

  const creditLogs = logs.filter(log => log.action === 'credits.minted');
  const productMap = new Map(products.map(p => [p.id, p]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Credit History</h1>
        <p className="text-muted-foreground">
          A log of all circularity credits you have earned.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Earned Credits</CardTitle>
          <CardDescription>
            You earn 10 credits for each product you successfully mark as
            recycled.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creditLogs.map(log => {
                const product = productMap.get(log.entityId);
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      {format(new Date(log.createdAt), 'PPP')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-green-500" />
                        <span>Credit Issued</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {product ? (
                        <Link
                          href={`/products/${product.id}`}
                          target="_blank"
                          className="flex items-center gap-2 hover:underline"
                        >
                          <Package className="h-4 w-4" />
                          {product.productName}
                        </Link>
                      ) : (
                        log.entityId
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="default">+{log.details.amount}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {creditLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    You haven't earned any credits yet. Start recycling!
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

    