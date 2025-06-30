// src/components/dashboards/service-provider-dashboard.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "../ui/button";
import type { User } from "@/types";
import { getProducts, getServiceTickets } from "@/lib/actions";
import { ArrowRight, Wrench, Ticket } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "../ui/badge";

export default async function ServiceProviderDashboard({
  user,
}: {
  user: User;
}) {
  const [products, tickets] = await Promise.all([
    getProducts(user.id),
    getServiceTickets(),
  ]);

  const availableManuals = products.filter((p) => p.manualUrl).length;
  const openTickets = tickets.filter((t) => t.status === "Open");

  const recentOpenTickets = openTickets
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  const productMap = new Map(products.map((p) => [p.id, p.productName]));

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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Manuals
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableManuals}</div>
            <p className="text-xs text-muted-foreground">
              Across all accessible products
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/dashboard/manuals">
                Browse Manuals <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTickets.length}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/dashboard/tickets">
                Manage All Tickets <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recently Opened Tickets</CardTitle>
          <CardDescription>
            The latest service requests needing your attention.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentOpenTickets.length > 0 ? (
            <div className="space-y-4">
              {recentOpenTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-medium">
                      {productMap.get(ticket.productId) || "Unknown Product"}
                    </p>
                    <p className="text-sm text-muted-foreground truncate max-w-xs">
                      {ticket.issue}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground shrink-0">
                    <p>
                      {formatDistanceToNow(new Date(ticket.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                    <p className="mt-1">
                      <Badge variant="destructive">{ticket.status}</Badge>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>No open tickets. All caught up!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
