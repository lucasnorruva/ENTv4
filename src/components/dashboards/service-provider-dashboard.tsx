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
import { getProducts } from "@/lib/actions";
import { ArrowRight, Wrench } from "lucide-react";
import Link from "next/link";

export default async function ServiceProviderDashboard({
  user,
}: {
  user: User;
}) {
  const products = await getProducts();
  const availableManuals = products.filter((p) => p.manualUrl).length;

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

      <div className="grid gap-6 md:grid-cols-2">
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
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access Product Manuals</CardTitle>
            <CardDescription>
              Search and download repair guides and technical documentation to
              service products.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/dashboard/manuals">
                Go to Manuals <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
