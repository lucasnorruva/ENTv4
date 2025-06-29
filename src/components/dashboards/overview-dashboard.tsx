// src/components/dashboards/overview-dashboard.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function OverviewDashboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
        <CardDescription>
          A summary of the Norruva system. This is a default view for roles
          without a specific dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          This is a generic dashboard view. Select a role with a specific
          interface to see more features.
        </p>
      </CardContent>
    </Card>
  );
}
