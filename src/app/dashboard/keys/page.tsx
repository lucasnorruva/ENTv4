// src/app/dashboard/keys/page.tsx
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface ApiKey {
  id: string;
  label: string;
  token: string;
  status: 'Active' | 'Revoked';
  createdAt: string;
}

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

export default function ApiKeysPage() {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys);

  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [isCreateKeyDialogOpen, setIsCreateKeyDialogOpen] = useState(false);

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
    toast({
      title: 'API Key Created',
      description: `New key "${newKey.label}" has been created.`,
    });
  };

  const handleRevokeKey = (id: string) => {
    setApiKeys(prev =>
      prev.map(key => (key.id === id ? { ...key, status: 'Revoked' } : key)),
    );
    toast({ title: 'API Key Revoked' });
  };

  const handleDeleteKey = (id: string) => {
    setApiKeys(prev => prev.filter(key => key.id !== id));
    toast({ title: 'API Key Deleted' });
  };

  return (
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
                    variant={key.status === 'Active' ? 'default' : 'secondary'}
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
                          This action cannot be undone. This will permanently
                          delete the API key "{key.label}".
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
  );
}
