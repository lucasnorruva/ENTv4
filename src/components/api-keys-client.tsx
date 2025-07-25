// src/components/api-keys-client.tsx
'use client'

import { useState, useTransition, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Trash2,
  ShieldOff,
  Copy,
  Check,
  Loader2,
  KeyRound,
  MoreHorizontal,
  Edit,
  Globe,
  Calendar,
} from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Collections } from '@/lib/constants';
import type { ApiKey, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { revokeApiKey, deleteApiKey } from '@/lib/actions/api-key-actions';
import { format } from 'date-fns';
import RelativeTime from './relative-time';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ApiKeyForm from './api-key-form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface ApiKeysClientProps {
  user: User;
}

export default function ApiKeysClient({ user }: ApiKeysClientProps) {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null);

  const [isViewKeyDialogOpen, setIsViewKeyDialogOpen] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const q = query(
      collection(db, Collections.API_KEYS),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      querySnapshot => {
        const keysData = querySnapshot.docs.map(
          doc => ({ id: doc.id, ...doc.data() } as ApiKey),
        );
        setApiKeys(keysData);
        setIsLoading(false);
      },
      error => {
        console.error('Error fetching API keys:', error);
        toast({
          title: 'Error loading keys',
          description: 'Could not fetch API keys in real-time.',
          variant: 'destructive',
        });
        setIsLoading(false);
      },
    );

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [user.id, toast]);

  const handleCreateNew = useCallback(() => {
    setSelectedApiKey(null);
    setIsFormOpen(true);
  }, []);

  const handleEdit = useCallback((key: ApiKey) => {
    setSelectedApiKey(key);
    setIsFormOpen(true);
  }, []);

  const handleSave = useCallback((result: { key: ApiKey; rawToken?: string }) => {
    if (result.rawToken) {
      setNewlyCreatedKey(result.rawToken);
      setIsViewKeyDialogOpen(true);
    }
    setIsFormOpen(false);
  }, []);

  const handleRevokeKey = useCallback((id: string) => {
    startTransition(async () => {
      try {
        await revokeApiKey(id, user.id);
        toast({ title: 'API Key Revoked' });
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to revoke API key.',
          variant: 'destructive',
        });
      }
    });
  }, [user.id, toast]);

  const handleDeleteKey = useCallback((id: string) => {
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
  }, [user.id, toast]);

  const copyToClipboard = useCallback(() => {
    if (newlyCreatedKey) {
      navigator.clipboard.writeText(newlyCreatedKey);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  }, [newlyCreatedKey]);

  const closeViewKeyDialog = useCallback(() => {
    setIsViewKeyDialogOpen(false);
    setNewlyCreatedKey(null);
  }, []);

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
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
              <TableHead>Expires</TableHead>
              <TableHead>IP Restrictions</TableHead>
              <TableHead>Last Used</TableHead>
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
                <TableCell>
                  {key.expiresAt ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                           <span className="flex items-center gap-1 text-xs">
                            <Calendar className="h-4 w-4"/>
                            <RelativeTime date={key.expiresAt} />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{format(new Date(key.expiresAt), 'PPP')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    'Never'
                  )}
                </TableCell>
                <TableCell>
                  {key.ipRestrictions && key.ipRestrictions.length > 0 ? (
                     <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="flex items-center gap-1 text-xs">
                           <Globe className="h-4 w-4"/>
                           {key.ipRestrictions.length} IP(s)
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{key.ipRestrictions.join(', ')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : 'Any'}
                </TableCell>
                <TableCell>
                    {key.lastUsed ? <RelativeTime date={key.lastUsed} /> : 'Never'}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={isPending}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleEdit(key)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRevokeKey(key.id)}
                        disabled={key.status !== 'Active'}
                      >
                        <ShieldOff className="mr-2 h-4 w-4" />
                        Revoke
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={e => e.preventDefault()}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
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
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {apiKeys.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <KeyRound className="h-12 w-12 text-muted-foreground" />
                    <h3 className="text-xl font-semibold">No API Keys Yet</h3>
                    <p className="text-muted-foreground">
                      Create your first API key to get started.
                    </p>
                    <Button onClick={handleCreateNew}>
                      Create API Key
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
      <ApiKeyForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        apiKey={selectedApiKey}
        user={user}
        onSave={handleSave}
      />
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
