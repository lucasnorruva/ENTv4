// src/components/webhook-management-client.tsx
'use client';

import React, { useState, useTransition, useEffect, useCallback, useMemo } from 'react';
import {
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Webhook as WebhookIcon,
  BookOpen,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Collections } from '@/lib/constants';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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

import type { Webhook, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { deleteWebhook } from '@/lib/actions/webhook-actions';
import WebhookForm from './webhook-form';

interface WebhookManagementClientProps {
  user: User;
}

export default function WebhookManagementClient({
  user,
}: WebhookManagementClientProps) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const q = query(
      collection(db, Collections.WEBHOOKS),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const hooksData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Webhook));
        setWebhooks(hooksData);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching webhooks: ", error);
        toast({
            title: 'Error',
            description: 'Could not load webhooks in real-time.',
            variant: 'destructive',
          });
        setIsLoading(false);
    });

    return () => unsubscribe();

  }, [user.id, toast]);

  const handleCreateNew = () => {
    setSelectedWebhook(null);
    setIsFormOpen(true);
  };

  const handleEdit = useCallback((webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback((webhookId: string) => {
    startTransition(async () => {
      try {
        await deleteWebhook(webhookId, user.id);
        toast({
          title: 'Webhook Deleted',
          description: 'The webhook has been successfully deleted.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete webhook.',
          variant: 'destructive',
        });
      }
    });
  }, [user.id, toast]);

  const handleSave = (savedWebhook: Webhook) => {
    // State will be updated by the real-time listener.
    setIsFormOpen(false);
  };
  
  const columns: ColumnDef<Webhook>[] = useMemo(
    () => [
       {
        accessorKey: 'url',
        header: 'Endpoint URL',
        cell: ({ row }) => (
          <Link
            href={`/dashboard/developer/webhooks/${row.original.id}`}
            className="font-mono text-xs hover:underline"
          >
            {row.original.url}
          </Link>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.status === 'active' ? 'default' : 'secondary'
            }
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: 'events',
        header: 'Subscribed Events',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.events.map(event => (
              <Badge key={event} variant="outline">
                {event}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => format(new Date(row.original.createdAt), 'PPP'),
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const webhook = row.original;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/dashboard/developer/webhooks/${webhook.id}`}
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      View Logs
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEdit(webhook)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
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
                          This will permanently delete the webhook for{' '}
                          <span className="font-mono text-xs bg-muted p-1 rounded">
                            {webhook.url}
                          </span>
                          .
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(webhook.id)}
                          disabled={isPending}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [handleEdit, handleDelete, isPending],
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Webhook Management</CardTitle>
              <CardDescription>
                Configure endpoints to receive real-time event notifications.
              </CardDescription>
            </div>
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" /> Create Webhook
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map(column => (
                    <TableHead key={column.id}>
                      {column.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.length > 0 ? (
                  webhooks.map(webhook => (
                    <TableRow key={webhook.id}>
                      {columns.map(column => (
                        <TableCell key={column.id}>
                          {flexRender(column.cell, { row: { original: webhook }})}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <WebhookIcon className="h-12 w-12 text-muted-foreground" />
                        <h3 className="text-xl font-semibold">
                          No Webhooks Yet
                        </h3>
                        <p className="text-muted-foreground">
                          Create your first webhook to receive notifications.
                        </p>
                        <Button onClick={handleCreateNew}>
                          <Plus className="mr-2 h-4 w-4" /> Create Webhook
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <WebhookForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        webhook={selectedWebhook}
        user={user}
        onSave={handleSave}
      />
    </>
  );
}
