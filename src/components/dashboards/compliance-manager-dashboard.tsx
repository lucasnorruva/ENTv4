// src/components/dashboards/compliance-manager-dashboard.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Product } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export default function ComplianceManagerDashboard({ flaggedProducts }: { flaggedProducts: Product[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Manager Dashboard</CardTitle>
        <CardDescription>
          Review and resolve compliance issues for flagged products.
        </CardDescription>
      </CardHeader>
      <CardContent>
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Date Flagged</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {flaggedProducts.map(product => (
                    <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.productName}</TableCell>
                        <TableCell>{product.supplier}</TableCell>
                        <TableCell>{formatDistanceToNow(new Date(product.lastVerificationDate!), { addSuffix: true })}</TableCell>
                        <TableCell className="text-right">
                             <Button variant="outline" size="sm" className="mr-2">View Details</Button>
                             <Button variant="secondary" size="sm">Resolve</Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
        {flaggedProducts.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
                <p>No products are currently flagged for non-compliance.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
