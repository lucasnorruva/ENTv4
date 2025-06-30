// src/components/dashboards/admin-dashboard.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { User } from "@/types";

export default function AdminDashboard({ user }: { user: User }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Dashboard</CardTitle>
        <CardDescription>
          Welcome, {user.fullName}. Here you can manage users, settings, and
          compliance rules.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Admin features are under development.</p>
      </CardContent>
    </Card>
  );
}
