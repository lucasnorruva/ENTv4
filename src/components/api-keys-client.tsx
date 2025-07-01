// src/components/api-keys-client.tsx
'use client';

import { useState, useTransition, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Plus,
  Trash2,
  ShieldOff,
  Copy,
  Check,
  Loader2,
  KeyRound,
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

import type { ApiKey, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { createApiKey, revokeApiKey, deleteApiKey } from '@/lib/actions';
import { db } from '@/lib/firebase';
import { Collections } from '@/lib/constants';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';

interface ApiKeysClientProps {
  user: User;
}

export default function ApiKeysClient({ user }: ApiKeysClientProps) {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [isViewKeyDialogOpen, setIsViewKeyDialogOpen] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const q = query(
      collection(db, Collections.API_KEYS),
      where('userId', '==', user.id),
    );

    const unsubscribe = onSnapshot(
      q,
      querySnapshot => {
        const keysData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate().toISOString(),
            updatedAt: data.updatedAt?.toDate().toISOString(),
            lastUsed: data.lastUsed?.toDate().toISOString(),
          } as ApiKey;
        });
        setApiKeys(keysData);
        setIsLoading(false);
      },
      error => {
        console.error('Error fetching API keys:', error);
        toast({
          title: 'Error',
          description: 'Failed to load API keys.',
          variant: 'destructive',
        });
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user.id, toast]);

  const handleCreateKey = () => {
    if (!newKeyLabel) {
      toast({
        title: 'Label required',
        description: 'Please provide a label for the new API key.',
        variant: 'destructive',
      });
      return;
    }
    startTransition(async () => {
      try {
        const { rawToken } = await createApiKey(newKeyLabel, user.id);
        // State will be updated by the listener, no need to call setApiKeys here.
        setNewlyCreatedKey(rawToken);
        setIsViewKeyDialogOpen(true);
        toast({
          title: 'API Key Created',
          description: `New key "${newKeyLabel}" has been created.`,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to create API key.',
          variant: 'destructive',
        });
      } finally {
        setIsCreateDialogOpen(false);
        setNewKeyLabel('');
      }
    });
  };

  const handleRevokeKey = (id: string) => {
    startTransition(async () => {
      try {
        await revokeApiKey(id, user.id);
        toast({ title: 'API Key Revoked' });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to revoke API key.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleDeleteKey = (id: string) => {
    startTransition(async () => {
      try {
        await deleteApiKey(id, user.id);
        toast({ title: 'API Key Deleted' });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete API key.',
          variant: 'destructive',
        });
      }
    });
  };

  const copyToClipboard = () => {
    if (newlyCreatedKey) {
      navigator.clipboard.writeText(newlyCreatedKey);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  const closeViewKeyDialog = () => {
    setIsViewKeyDialogOpen(false);
    setNewlyCreatedKey(null);
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Give your key a descriptive label to help you identify it later.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Label htmlFor="key-label">Label</Label>
              <Input
                id="key-label"
                value={newKeyLabel}
                onChange={e => setNewKeyLabel(e.target.value)}
                placeholder="e.g. My Production Server"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleCreateKey} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
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
                <TableCell className="font-mono text-xs">
                  {key.token}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={key.status === 'Active' ? 'default' : 'secondary'}
                  >
                    {key.status}
                  </Badge>
                </TableCell>
                <TableCell>{format(new Date(key.createdAt), 'PPP')}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending || key.status !== 'Active'}
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
                        disabled={isPending}
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
            {apiKeys.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <KeyRound className="h-12 w-12 text-muted-foreground" />
                    <h3 className="text-xl font-semibold">No API Keys Yet</h3>
                    <p className="text-muted-foreground">
                      Create your first API key to get started.
                    </p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      Create API Key
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
      <Dialog open={isViewKeyDialogOpen} onOpenChange={closeViewKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created Successfully</DialogTitle>
            <DialogDescription>
              Your new API key has been created. Copy this key and store it
              securely. You will not be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Input
              readOnly
              value={newlyCreatedKey || ''}
              className="font-mono pr-12"
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={copyToClipboard}
            >
              {hasCopied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={closeViewKeyDialog}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
