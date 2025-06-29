// src/components/dashboards/service-provider-dashboard.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '../ui/button';

export default function ServiceProviderDashboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Provider Dashboard</CardTitle>
        <CardDescription>
          Access product manuals and manage service tickets.
        </CardDescription>
      </CardHeader>
      <CardContent>
         <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-semibold">Product Manuals</h3>
            <p className="text-sm text-muted-foreground">Search and download repair guides.</p>
          </div>
          <Button>Access Manuals</Button>
        </div>
      </CardContent>
    </Card>
  );
}
