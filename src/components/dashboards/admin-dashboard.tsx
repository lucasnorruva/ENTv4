// src/components/dashboards/admin-dashboard.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '../ui/button';

export default function AdminDashboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Dashboard</CardTitle>
        <CardDescription>
          Manage users, roles, and system-wide compliance configurations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-semibold">User Management</h3>
            <p className="text-sm text-muted-foreground">Add, edit, or remove users and assign roles.</p>
          </div>
          <Button>Manage Users</Button>
        </div>
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-semibold">Compliance Paths</h3>
            <p className="text-sm text-muted-foreground">Define and configure compliance rules for product categories.</p>
          </div>
          <Button>Configure Rules</Button>
        </div>
      </CardContent>
    </Card>
  );
}
