// src/app/dashboard/service-provider/analytics/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getProducts, getServiceTickets } from '@/lib/actions';
import { UserRoles, hasRole } from '@/lib/constants';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Wrench, BookCopy, Clock } from 'lucide-react';
import { format, subDays, formatDistanceToNow } from 'date-fns';
import ProductsOverTimeChart from '@/components/charts/products-over-time-chart'; // Reusing this chart for services over time

export default async function ServiceProviderAnalyticsPage() {
  const user = await getCurrentUser(UserRoles.SERVICE_PROVIDER);

  if (!hasRole(user, UserRoles.SERVICE_PROVIDER)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  const [products, serviceLogs] = await Promise.all([
    getProducts(user.id),
    getServiceTickets(user.id),
  ]);

  const stats = {
    totalServices: serviceLogs.length,
    productsWithManuals: products.filter(p => p.manualUrl).length,
    servicesLast30Days: serviceLogs.filter(
      log => new Date(log.createdAt) > subDays(new Date(), 30),
    ).length,
  };

  const servicesByDate = serviceLogs.reduce(
    (acc, log) => {
      const date = format(new Date(log.createdAt), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date]++;
      return acc;
    },
    {} as Record<string, number>,
  );

  const servicesOverTimeData = Object.entries(servicesByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const recentActivity = serviceLogs.slice(0, 5);
  const productMap = new Map(products.map(p => [p.id, p.productName]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Service Analytics</h1>
        <p className="text-muted-foreground">
          An overview of your service activities and key metrics.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Services
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServices}</div>
            <p className="text-xs text-muted-foreground">
              Total maintenance records created
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Services (Last 30d)
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.servicesLast30Days}</div>
            <p className="text-xs text-muted-foreground">
              Number of services in the last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Product Manuals
            </CardTitle>
            <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productsWithManuals}</div>
            <p className="text-xs text-muted-foreground">
              Manuals available for products
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Services Performed Over Time</CardTitle>
            <CardDescription>
              A view of your maintenance activity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductsOverTimeChart data={servicesOverTimeData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Service Activity</CardTitle>
            <CardDescription>
              A stream of your latest service records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map(ticket => {
                const product = ticket.productId
                  ? productMap.get(ticket.productId)
                  : null;
                return (
                  <div key={ticket.id} className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-full">
                      <Wrench className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Service for {product || 'Unknown Product'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {ticket.issue}
                      </p>
                    </div>
                    <p
                      className="text-xs text-muted-foreground shrink-0"
                      suppressHydrationWarning
                    >
                      {formatDistanceToNow(new Date(ticket.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                );
              })}
              {recentActivity.length === 0 && (
                <p className="text-sm text-center text-muted-foreground py-4">
                  No service activity yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
