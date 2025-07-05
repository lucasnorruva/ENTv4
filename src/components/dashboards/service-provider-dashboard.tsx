// src/components/dashboards/service-provider-dashboard.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '../ui/button';
import type { User } from '@/types';
import { getProducts, getServiceTickets, getProductionLines } from '@/lib/actions';
import { ArrowRight, Wrench, Ticket, BarChart3, BookCopy, CheckSquare } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '../ui/badge';

export default async function ServiceProviderDashboard({
  user,
}: {
  user: User;
}) {
  const [products, allTickets, lines] = await Promise.all([
    getProducts(user.id),
    getServiceTickets(user.id),
    getProductionLines(),
  ]);

  const tickets = allTickets.filter(t => t.userId === user.id);

  const stats = {
    productsWithManuals: products.filter(p => p.manualUrl).length,
    openTickets: tickets.filter(t => t.status === 'Open').length,
    totalServices: tickets.length,
    closedTickets: tickets.filter(t => t.status === 'Closed').length,
  };

  const recentActivity = tickets
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() -
        new Date(a.updatedAt).getTime(),
    )
    .slice(0, 5);

  const productMap = new Map(products.map(p => [p.id, p.productName]));
  const lineMap = new Map(lines.map(l => [l.id, l.name]));

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Open':
        return 'destructive';
      case 'In Progress':
        return 'secondary';
      case 'Closed':
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Service Provider Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome, {user.fullName}. Access product manuals and manage service
          tickets.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServices}</div>
            <p className="text-xs text-muted-foreground">
              Service records created
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openTickets}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting your action
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Closed</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.closedTickets}</div>
            <p className="text-xs text-muted-foreground">
              Completed service requests
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Products with Manuals
            </CardTitle>
            <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productsWithManuals}</div>
            <p className="text-xs text-muted-foreground">
              Available for reference
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                The latest updates to your service tickets.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map(ticket => {
                    const entityName = ticket.productId ? productMap.get(ticket.productId) : ticket.productionLineId ? lineMap.get(ticket.productionLineId) : 'Unknown Entity';
                    return (
                      <div
                        key={ticket.id}
                        className="flex items-center justify-between gap-4"
                      >
                        <div>
                          <p className="font-medium">
                            {entityName}
                          </p>
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {ticket.issue}
                          </p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground shrink-0">
                          <p suppressHydrationWarning>
                            {formatDistanceToNow(new Date(ticket.updatedAt), {
                              addSuffix: true,
                            })}
                          </p>
                          <div className="mt-1">
                            <Badge variant={getStatusVariant(ticket.status)}>{ticket.status}</Badge>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No open tickets. All caught up!</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/dashboard/service-provider/tickets">
                Manage All Tickets <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <div className="space-y-6">
            <Card>
            <CardHeader>
                <CardTitle>Browse Products</CardTitle>
                <CardDescription>
                Find product manuals and service history in the catalog.
                </CardDescription>
            </CardHeader>
            <CardFooter>
                <Button asChild className="w-full">
                <Link href="/dashboard/service-provider/products">
                    Go to Product Catalog <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                </Button>
            </CardFooter>
            </Card>

            <Card>
            <CardHeader>
                <CardTitle>View Analytics</CardTitle>
                <CardDescription>
                Analyze your service performance and history.
                </CardDescription>
            </CardHeader>
            <CardFooter>
                <Button asChild variant="secondary" className="w-full">
                <Link href="/dashboard/service-provider/analytics">
                    Go to Analytics <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                </Button>
            </CardFooter>
            </Card>
        </div>
      </div>
    </div>
  );
}
