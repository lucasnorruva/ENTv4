// src/components/dashboards/developer-dashboard.tsx
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { User } from '@/types';
import { Button } from '../ui/button';
import Link from 'next/link';

export default function DeveloperDashboard({ user }: { user: User }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Developer Dashboard</CardTitle>
          <CardDescription>
            Tools and resources for integrating with the Norruva platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Welcome, {user.fullName}. Use the sidebar navigation to manage your API Keys, view logs, and configure integrations.
          </p>
          <Button asChild>
            <Link href="/docs/api.md" target="_blank">View API Documentation</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
