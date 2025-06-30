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

export default async function ServiceProviderDashboard({
  user,
}: {
  user: User;
}) {
  const [products, tickets] = await Promise.all([
    getProducts(),
    getServiceTickets(),
  ]);

  const availableManuals = products.filter((p) => p.manualUrl).length;
  const openTickets = tickets.filter((t) => t.status === "Open").length;

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
            <div className="text-2xl font-bold">{openTickets}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/dashboard/tickets">
                Manage Tickets <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
