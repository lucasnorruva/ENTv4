
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
import { KeyRound, ArrowRight, Activity } from 'lucide-react';
import { getApiKeys, getAuditLogsForUser } from '@/lib/actions';
import { Badge } from '../ui/badge';
import { formatDistanceToNow } from 'date-fns';

export default async function DeveloperDashboard({ user }: { user: User }) {
  const [apiKeys, auditLogs] = await Promise.all([
    getApiKeys(user.id),
    getAuditLogsForUser(user.id),
  ]);
  const activeKeys = apiKeys.filter(k => k.status === 'Active').length;
  const recentApiActivity = auditLogs
    .filter(log => log.action.startsWith('api.'))
    .slice(0, 5);

  const getStatusVariant = (status: number) => {
    if (status >= 500) return 'destructive';
    if (status >= 400) return 'secondary';
    if (status >= 200 && status < 300) return 'default';
    return 'outline';
  };

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
            <p className="text-xs text-muted-foreground">Active API Keys</p>
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
              <Link href="/docs/api" target="_blank">
                View API Docs
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            Recent API Activity
          </CardTitle>
          <CardDescription>
            A log of the last few requests made using your API keys.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentApiActivity.map(log => (
              <div
                key={log.id}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      log.details.method === 'POST' ? 'outline' : 'secondary'
                    }
                  >
                    {log.details.method}
                  </Badge>
                  <p className="font-mono text-sm">{log.details.endpoint}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={getStatusVariant(log.details.status)}>
                    {log.details.status}
                  </Badge>
                  <p
                    className="text-xs text-muted-foreground shrink-0 w-28 text-right"
                    suppressHydrationWarning
                  >
                    {formatDistanceToNow(new Date(log.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))}
            {recentApiActivity.length === 0 && (
              <p className="text-sm text-center text-muted-foreground py-4">
                No recent API activity found.
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/logs">View All API Logs</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
