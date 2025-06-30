// src/components/dashboards/developer-dashboard.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import type { User } from '@/types';
import { Button } from '../ui/button';
import Link from 'next/link';
import { getApiKeysForUser } from '@/lib/actions';
import { KeyRound, ArrowRight } from 'lucide-react';

export default async function DeveloperDashboard({ user }: { user: User }) {
  const apiKeys = await getApiKeysForUser(user.id);
  const activeKeys = apiKeys.filter(k => k.status === 'Active').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Developer Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome, {user.fullName}. Use the sidebar to manage API Keys, view
          logs, and configure integrations.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-muted-foreground" />
              API Key Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{activeKeys}</p>
            <p className="text-xs text-muted-foreground">
              Active API keys in your account
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dashboard/keys">
                Manage Keys <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>API Documentation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Explore our comprehensive REST API to integrate Norruva with your
              existing systems.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/docs/api.md" target="_blank">
                View API Docs
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
