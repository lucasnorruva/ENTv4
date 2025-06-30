// src/components/dashboards/admin-dashboard.tsx
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
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { FileQuestion, ScrollText, Settings2 } from 'lucide-react';

export default function AdminDashboard({ user }: { user: User }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome, {user.fullName}. Manage system-wide compliance paths and
          settings from here.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          Active Compliance Paths
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {compliancePaths.map(path => (
            <Card key={path.name} className="flex flex-col">
              <CardHeader>
                <CardTitle>{path.name}</CardTitle>
                <Badge variant="outline" className="w-fit">
                  {path.category}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                <p className="text-sm text-muted-foreground">
                  {path.description}
                </p>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <FileQuestion className="h-4 w-4 text-muted-foreground" />
                    Regulations
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {path.regulations.map(reg => (
                      <Badge key={reg} variant="secondary">
                        {reg}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <ScrollText className="h-4 w-4 text-muted-foreground" />
                    Rules
                  </h4>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                    {JSON.stringify(path.rules, null, 2)}
                  </pre>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" disabled>
                  <Settings2 className="mr-2 h-4 w-4" />
                  Manage Path (Soon)
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
