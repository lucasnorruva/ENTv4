// src/components/dashboards/developer-dashboard.tsx
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ShieldOff } from 'lucide-react';
import type { User } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';

const initialApiKeys = [
  {
    id: 'key-1',
    label: 'Primary Server Key',
    token: 'sk_live_******************abcd',
    status: 'Active' as const,
    createdAt: '2024-06-15',
  },
  {
    id: 'key-2',
    label: 'Analytics Service Key',
    token: 'sk_live_******************efgh',
    status: 'Active' as const,
    createdAt: '2024-05-20',
  },
  {
    id: 'key-3',
    label: 'Old Integration Key',
    token: 'sk_live_******************ijkl',
    status: 'Revoked' as const,
    createdAt: '2023-11-10',
  },
];

const initialWebhooks = [
  {
    id: 'hook-1',
    url: 'https://api.example.com/webhooks/norruva',
    status: 'Active' as const,
    events: ['product.published', 'verification.failed'],
  },
  {
    id: 'hook-2',
    url: 'https://staging.example.com/webhooks',
    status: 'Disabled' as const,
    events: ['product.created'],
  },
];

const mockApiLogs = [
  {
    timestamp: '2024-07-23T10:00:00Z',
    level: 'INFO',
    message: 'POST /api/products - 201 Created',
  },
  {
    timestamp: '2024-07-23T10:01:15Z',
    level: 'INFO',
    message: 'GET /api/products/pp-001 - 200 OK',
  },
  {
    timestamp: '2024-07-23T10:02:30Z',
    level: 'WARN',
    message: 'AI sustainability check for pp-003 took 3.5s',
  },
  {
    timestamp: '2024-07-23T10:05:00Z',
    level: 'INFO',
    message: 'CRON /api/cron - Verification job started.',
  },
  {
    timestamp: '2024-07-23T10:05:45Z',
    level: 'ERROR',
    message: 'Failed to connect to blockchain anchoring service.',
  },
];

interface ApiKey {
  id: string;
  label: string;
  token: string;
  status: 'Active' | 'Revoked';
  createdAt: string;
}

interface Webhook {
  id: string;
  url: string;
  status: 'Active' | 'Disabled';
  events: string[];
}

export default function DeveloperDashboard({ user }: { user: User }) {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys);
  const [webhooks, setWebhooks] = useState<Webhook[]>(initialWebhooks);

  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [isCreateKeyDialogOpen, setIsCreateKeyDialogOpen] = useState(false);

  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [isCreateWebhookDialogOpen, setIsCreateWebhookDialogOpen] =
    useState(false);

  const handleCreateKey = () => {
    if (!newKeyLabel) {
      toast({
        title: 'Label required',
        description: 'Please provide a label for the new API key.',
        variant: 'destructive',
      });
      return;
    }
    const newKey: ApiKey = {
      id: `key-${Date.now()}`,
      label: newKeyLabel,
      token: `sk_live_******************${Math.random()
        .toString(36)
        .substring(2, 6)}`,
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setApiKeys(prev => [newKey, ...prev]);
    setNewKeyLabel('');
    setIsCreateKeyDialogOpen(false);
    toast({ title: 'API Key Created', description: `New key "${newKey.label}" has been created.` });
  };

  const handleRevokeKey = (id: string) => {
    setApiKeys(prev =>
      prev.map(key =>
        key.id === id ? { ...key, status: 'Revoked' } : key
      ),
    );
    toast({ title: 'API Key Revoked' });
  };

  const handleDeleteKey = (id: string) => {
    setApiKeys(prev => prev.filter(key => key.id !== id));
    toast({ title: 'API Key Deleted' });
  };

  const handleCreateWebhook = () => {
    if (!newWebhookUrl || !newWebhookUrl.startsWith('https://')) {
       toast({
        title: 'Invalid URL',
        description: 'Please provide a valid HTTPS URL for the webhook.',
        variant: 'destructive',
      });
      return;
    }
    const newWebhook: Webhook = {
      id: `hook-${Date.now()}`,
      url: newWebhookUrl,
      status: 'Active',
      events: ['product.published', 'product.updated', 'verification.failed'],
    };
    setWebhooks(prev => [newWebhook, ...prev]);
    setNewWebhookUrl('');
    setIsCreateWebhookDialogOpen(false);
    toast({ title: 'Webhook Added', description: `New webhook for "${newWebhook.url}" is now active.` });
  };
  
  const handleDeleteWebhook = (id: string) => {
    setWebhooks(prev => prev.filter(hook => hook.id !== id));
    toast({ title: 'Webhook Deleted' });
  };


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
                <Dialog
                  open={isCreateKeyDialogOpen}
                  onOpenChange={setIsCreateKeyDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2" />
                      Create API Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New API Key</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="key-label" className="text-right">
                          Label
                        </Label>
                        <Input
                          id="key-label"
                          value={newKeyLabel}
                          onChange={e => setNewKeyLabel(e.target.value)}
                          className="col-span-3"
                          placeholder="e.g. My Production Server"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreateKey}>Create Key</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
                  {apiKeys.map(key => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.label}</TableCell>
                      <TableCell className="font-mono">{key.token}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            key.status === 'Active' ? 'default' : 'secondary'
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
                          disabled={key.status !== 'Active'}
                          onClick={() => handleRevokeKey(key.id)}
                        >
                          <ShieldOff className="mr-2 h-3 w-3" />
                          Revoke
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="mr-2 h-3 w-3" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete the API key "{key.label}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteKey(key.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
                <Dialog
                  open={isCreateWebhookDialogOpen}
                  onOpenChange={setIsCreateWebhookDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2" />
                      Add Webhook
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Webhook</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="webhook-url" className="text-right">
                          URL
                        </Label>
                        <Input
                          id="webhook-url"
                          value={newWebhookUrl}
                          onChange={e => setNewWebhookUrl(e.target.value)}
                          className="col-span-3"
                          placeholder="https://api.example.com/webhook"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                       <DialogClose asChild>
                         <Button variant="outline">Cancel</Button>
                       </DialogClose>
                       <Button onClick={handleCreateWebhook}>Add Webhook</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
                  {webhooks.map(hook => (
                    <TableRow key={hook.id}>
                      <TableCell className="font-mono">{hook.url}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            hook.status === 'Active' ? 'default' : 'secondary'
                          }
                        >
                          {hook.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {hook.events.map(event => (
                            <Badge key={event} variant="outline">
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the webhook for "{hook.url}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteWebhook(hook.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
                          log.level === 'ERROR'
                            ? 'text-destructive'
                            : log.level === 'WARN'
                              ? 'text-yellow-500'
                              : 'text-primary'
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
