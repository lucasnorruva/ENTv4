// src/components/dashboards/auditor-dashboard.tsx
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

export default function AuditorDashboard({ products }: { products: Product[] }) {
    const productsToAudit = products.filter(p => p.verificationStatus === 'Pending' || p.verificationStatus === 'Failed');
  return (
    <Card>
      <CardHeader>
        <CardTitle>Auditor Dashboard</CardTitle>
        <CardDescription>
          Review products for compliance, run checks, and view audit history.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Current Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {productsToAudit.map(product => (
                    <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.productName}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>
                            <Badge variant={product.verificationStatus === 'Failed' ? 'destructive' : 'secondary'}>
                                {product.verificationStatus}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <Button variant="outline" size="sm">Review Product</Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
        {productsToAudit.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
                <p>No products are currently in the audit queue.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
