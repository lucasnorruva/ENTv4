// src/components/dashboards/supplier-dashboard.tsx
"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { User } from "@/types";
import { ArrowRight, BookCopy, CheckCircle, Clock, Hourglass } from "lucide-react";
import { useEffect, useState } from "react";
import { getProducts } from "@/lib/actions";
import { Skeleton } from "../ui/skeleton";

export default function SupplierDashboard({ user }: { user: User }) {
  const [stats, setStats] = useState<{ total: number, pending: number, verified: number } | null>(null);

  useEffect(() => {
    async function fetchStats() {
      const products = await getProducts();
      setStats({
        total: products.length,
        pending: products.filter(p => p.verificationStatus === "Pending").length,
        verified: products.filter(p => p.verificationStatus === "Verified").length,
      });
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Supplier Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back, {user.fullName}. Here's an overview of your product
          passports.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats ? <div className="text-2xl font-bold">{stats.total}</div> : <Skeleton className="h-8 w-1/2" />}
            <p className="text-xs text-muted-foreground">
              Passports you are managing
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats ? <div className="text-2xl font-bold">{stats.pending}</div> : <Skeleton className="h-8 w-1/2" />}
            <p className="text-xs text-muted-foreground">
              Products awaiting auditor verification
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Passports</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats ? <div className="text-2xl font-bold">{stats.verified}</div> : <Skeleton className="h-8 w-1/2" />}
            <p className="text-xs text-muted-foreground">
              Products that are fully compliant
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Your Passports</CardTitle>
          <CardDescription>
            Create, edit, and track the verification status of all your product
            passports.
          </CardDescription>
        </CardHeader>
        <CardFooter className="gap-4">
           <Button asChild>
            <Link href="/dashboard/products">
              Manage Products <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/history">
              View Activity History <Clock className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
