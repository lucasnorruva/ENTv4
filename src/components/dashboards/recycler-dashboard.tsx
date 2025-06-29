// src/components/dashboards/recycler-dashboard.tsx
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

export default function RecyclerDashboard({ products }: { products: Product[] }) {

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recycler Dashboard</CardTitle>
        <CardDescription>
          Track end-of-life products and confirm recycling compliance.
        </CardDescription>
      </CardHeader>
      <CardContent>
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Current EOL Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {products.map(product => (
                    <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.productName}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>
                            <Badge variant={product.endOfLifeStatus === 'Recycled' ? 'default' : 'secondary'}>
                                {product.endOfLifeStatus ?? 'Active'}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                             <Button variant="outline" size="sm" disabled={product.endOfLifeStatus !== 'Active'}>
                                Mark as Recycled
                             </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
