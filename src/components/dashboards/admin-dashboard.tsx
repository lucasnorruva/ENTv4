// src/components/dashboards/admin-dashboard.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "../ui/button";
import type { User } from "@/types";
import {
  Users,
  BookCopy,
  ShieldCheck,
  FileQuestion,
  Code,
  Wrench,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const mockUsers = [
  {
    id: "user-supplier",
    name: "Supplier User",
    email: "supplier@norruva.com",
    role: "Supplier",
    status: "Active",
  },
  {
    id: "user-auditor",
    name: "Auditor User",
    email: "auditor@norruva.com",
    role: "Auditor",
    status: "Active",
  },
  {
    id: "user-inactive",
    name: "Former Employee",
    email: "former@norruva.com",
    role: "Supplier",
    status: "Inactive",
  },
];

export default function AdminDashboard({ user }: { user: User }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
          <CardDescription>
            Welcome, {user.fullName}. Here's an overview of your organization's
            platform activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">
                  +2 active this month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Passports
                </CardTitle>
                <BookCopy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">153</div>
                <p className="text-xs text-muted-foreground">
                  +18 created this month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Compliance Rate
                </CardTitle>
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94%</div>
                <p className="text-xs text-muted-foreground">
                  Across all published products
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Invite, edit, or deactivate users and manage their roles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {u.email}
                      </div>
                    </TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          u.status === "Active" ? "default" : "secondary"
                        }
                      >
                        {u.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button className="mt-4 w-full">Manage All Users</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Configuration</CardTitle>
            <CardDescription>
              Manage compliance rules, API settings, and integrations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <FileQuestion className="h-6 w-6" />
                <div>
                  <h3 className="font-semibold">Compliance Paths</h3>
                  <p className="text-sm text-muted-foreground">
                    Define regulatory rulesets.
                  </p>
                </div>
              </div>
              <Button variant="outline">Configure</Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Code className="h-6 w-6" />
                <div>
                  <h3 className="font-semibold">API & Webhooks</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage integrations.
                  </p>
                </div>
              </div>
              <Button variant="outline">Manage</Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Wrench className="h-6 w-6" />
                <div>
                  <h3 className="font-semibold">Organization Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Branding and defaults.
                  </p>
                </div>
              </div>
              <Button variant="outline">Edit</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
