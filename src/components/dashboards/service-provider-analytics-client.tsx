// src/components/dashboards/service-provider-analytics-client.tsx
'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Collections } from '@/lib/constants';
import type { User, Product, ServiceTicket } from '@/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Wrench,
  BookCopy,
  Clock,
  BarChart3,
  Ticket,
  CheckSquare,
  Loader2,
} from 'lucide-react';
import { differenceInHours } from 'date-fns';
import ServiceTicketStatusChart from '@/components/charts/service-ticket-status-chart';
import ServiceTicketsByCategoryChart from '@/components/charts/service-tickets-by-category-chart';

export default function ServiceProviderAnalyticsClient({ user }: { user: User }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [serviceTickets, setServiceTickets] = useState<ServiceTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    const productQuery = query(collection(db, Collections.PRODUCTS));
    unsubscribes.push(onSnapshot(productQuery, snapshot => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }));

    const ticketsQuery = query(collection(db, Collections.SERVICE_TICKETS));
    unsubscribes.push(onSnapshot(ticketsQuery, snapshot => {
      setServiceTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceTicket)));
      setIsLoading(false);
    }));

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const openTickets = serviceTickets.filter(t => t.status === 'Open');
  const closedTickets = serviceTickets.filter(t => t.status === 'Closed');

  const resolutionTimes = closedTickets
    .map(t => differenceInHours(new Date(t.updatedAt), new Date(t.createdAt)))
    .filter(t => t >= 0);

  const avgResolutionTime =
    resolutionTimes.length > 0
      ? Math.round(
          resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length,
        )
      : 0;

  const productMap = new Map(products.map(p => [p.id, p]));

  const ticketsByCategory = serviceTickets.reduce(
    (acc, ticket) => {
      if (ticket.productId) {
        const product = productMap.get(ticket.productId);
        if (product) {
          acc[product.category] = (acc[product.category] || 0) + 1;
        }
      } else {
        acc['Production Line'] = (acc['Production Line'] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const categoryChartData = Object.entries(ticketsByCategory)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  const ticketStatusData = {
    open: openTickets.length,
    inProgress: serviceTickets.filter(t => t.status === 'In Progress').length,
    closed: closedTickets.length,
  };

  const topCategory =
    categoryChartData.length > 0 ? categoryChartData[0].category : 'N/A';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Service Analytics</h1>
        <p className="text-muted-foreground">
          An overview of your service activities and key metrics.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceTickets.length}</div>
            <p className="text-xs text-muted-foreground">
              Total maintenance records created
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTickets.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently awaiting action
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Resolution Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResolutionTime} hours</div>
            <p className="text-xs text-muted-foreground">
              For all closed tickets
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topCategory}</div>
            <p className="text-xs text-muted-foreground">
              Most frequently serviced
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tickets by Status</CardTitle>
            <CardDescription>
              A breakdown of all tickets by their current status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ServiceTicketStatusChart data={ticketStatusData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tickets by Category</CardTitle>
            <CardDescription>
              Volume of service tickets across different product categories.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ServiceTicketsByCategoryChart data={categoryChartData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
