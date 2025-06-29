// src/components/dashboards/developer-dashboard.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ShieldOff } from "lucide-react";

const mockApiLogs = [
  {
    timestamp: "2024-07-23T10:00:00Z",
    level: "INFO",
    message: "POST /api/products - 201 Created",
  },
  {
    timestamp: "2024-07-23T10:01:15Z",
    level: "INFO",
    message: "GET /api/products/pp-001 - 200 OK",
  },
  {
    timestamp: "2024-07-23T10:02:30Z",
    level: "WARN",
    message: "AI sustainability check for pp-003 took 3.5s",
  },
  {
    timestamp: "2024-07-23T10:05:00Z",
    level: "INFO",
    message: "CRON /api/cron - Verification job started.",
  },
  {
    timestamp: "2024-07-23T10:05:45Z",
    level: "ERROR",
    message: "Failed to connect to blockchain anchoring service.",
  },
];

const mockApiKeys = [
  {
    id: "key-1",
    label: "Primary Server Key",
    token: "sk_live_******************abcd",
    status: "Active",
    createdAt: "2024-06-15",
  },
  {
    id: "key-2",
    label: "Analytics Service Key",
    token: "sk_live_******************efgh",
    status: "Active",
    createdAt: "2024-05-20",
  },
  {
    id: "key-3",
    label: "Old Integration Key",
    token: "sk_live_******************ijkl",
    status: "Revoked",
    createdAt: "2023-11-10",
  },
];

const mockWebhooks = [
  {
    id: "hook-1",
    url: "https://api.example.com/webhooks/norruva",
    status: "Active",
    events: ["product.published", "verification.failed"],
  },
  {
    id: "hook-2",
    url: "https://staging.example.com/webhooks",
    status: "Disabled",
    events: ["product.created"],
  },
];

export default function DeveloperDashboard() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Developer Dashboard</CardTitle>
          <CardDescription>
            Monitor API logs, manage API keys, webhooks, and system health for
            your integrations.
          </CardDescription>
        </CardHeader>
      </Card>
      <Tabs defaultValue="apiKeys" className="w-full">
        <TabsList>
          <TabsTrigger value="apiKeys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="logs">API Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="apiKeys" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Manage API keys for accessing the Norruva API.
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2" />
                  Create API Key
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Token</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockApiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.label}</TableCell>
                      <TableCell className="font-mono">{key.token}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            key.status === "Active" ? "default" : "secondary"
                          }
                        >
                          {key.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{key.createdAt}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={key.status !== "Active"}
                        >
                          <ShieldOff className="mr-2 h-3 w-3" />
                          Revoke
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="mr-2 h-3 w-3" />
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Webhooks</CardTitle>
                  <CardDescription>
                    Configure endpoints to receive events from Norruva.
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2" />
                  Add Webhook
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Endpoint URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockWebhooks.map((hook) => (
                    <TableRow key={hook.id}>
                      <TableCell className="font-mono">{hook.url}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            hook.status === "Active" ? "default" : "secondary"
                          }
                        >
                          {hook.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {hook.events.map((event) => (
                            <Badge key={event} variant="outline">
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time API Logs</CardTitle>
              <CardDescription>A live stream of API requests.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-72 w-full rounded-md border p-4 bg-muted/50">
                <div className="font-mono text-xs">
                  {mockApiLogs.map((log, index) => (
                    <div key={index} className="flex gap-4">
                      <span className="text-muted-foreground">
                        {log.timestamp}
                      </span>
                      <span
                        className={
                          log.level === "ERROR"
                            ? "text-destructive"
                            : "text-primary"
                        }
                      >
                        [{log.level}]
                      </span>
                      <span>{log.message}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
