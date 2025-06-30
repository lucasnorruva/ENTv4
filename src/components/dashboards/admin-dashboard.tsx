// src/components/dashboards/admin-dashboard.tsx
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { User } from '@/types';
import { compliancePaths } from '@/lib/compliance-data';
import { getMockUsers } from '@/lib/auth';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  FileQuestion,
  ScrollText,
  Settings2,
  Users,
  ArrowRight,
} from 'lucide-react';

export default async function AdminDashboard({ user }: { user: User }) {
  const allUsers = await getMockUsers();
  const totalUsers = allUsers.length;
  const totalCompliancePaths = compliancePaths.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome, {user.fullName}. Manage system-wide users, compliance, and
          settings from here.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalUsers}</p>
            <p className="text-xs text-muted-foreground">
              Total users in the system
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dashboard/users">
                Manage Users <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileQuestion className="h-5 w-5 text-muted-foreground" />
              Compliance Paths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalCompliancePaths}</p>
            <p className="text-xs text-muted-foreground">
              Active compliance paths
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dashboard/compliance">
                Manage Paths <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}