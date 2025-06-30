// src/components/dashboards/admin-dashboard.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { User } from "@/types";
import { compliancePaths } from "@/lib/compliance-data";
import { Badge } from "../ui/badge";

export default function AdminDashboard({ user }: { user: User }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
          <CardDescription>
            Welcome, {user.fullName}. Here you can manage users, settings, and
            system-wide compliance rules.
          </CardDescription>
        </CardHeader>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-4">
          Active Compliance Paths
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {compliancePaths.map((path) => (
            <Card key={path.name}>
              <CardHeader>
                <CardTitle>{path.name}</CardTitle>
                <CardDescription>{path.category}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {path.description}
                </p>
                <div>
                  <h4 className="font-semibold text-sm mb-2">Regulations:</h4>
                  <div className="flex flex-wrap gap-2">
                    {path.regulations.map((reg) => (
                      <Badge key={reg} variant="secondary">
                        {reg}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">Rules:</h4>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                    {JSON.stringify(path.rules, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}