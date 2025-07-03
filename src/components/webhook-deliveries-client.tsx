// src/components/webhook-deliveries-client.tsx
'use client';

import React, { useState, useTransition, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Webhook as WebhookIcon,
} from 'lucide-react';
import type { Webhook, AuditLog, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { replayWebhook } from '@/lib/actions';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Collections } from '@/lib/constants';

interface WebhookDeliveriesClientProps {
  webhook: Webhook;
  user: User;
}

export default function WebhookDeliveriesClient({
  webhook,
  user,
}: WebhookDeliveriesClientProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replayingId, setReplayingId] = useState<string | null>(null);
  const [isReplaying, startReplayTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const q = query(
      collection(db, Collections.AUDIT_LOGS),
      where('entityId', '==', webhook.id),
      where('action', 'in', [
        'webhook.delivery.success',
        'webhook.delivery.failure',
        'webhook.replay.initiated',
      ]),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const logsData = snapshot.docs.map(
          doc => ({ id: doc.id, ...doc.data() }) as AuditLog,
        );
        setLogs(logsData);
        setIsLoading(false);
      },
      error => {
        console.error('Error listening to delivery logs:', error);
        toast({
          title: 'Real-time Error',
          description: 'Could not listen for new webhook deliveries.',
          variant: 'destructive',
        });
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [webhook.id, toast]);

  const handleReplay = (log: AuditLog) => {
    setReplayingId(log.id);
    startReplayTransition(async () => {
      toast({
        title: 'Replaying webhook...',
        description: `Attempting to redeliver event for product ${log.details.productId}.`,
      });
      try {
        await replayWebhook(log.id, user.id);
        toast({
          title: 'Success',
          description:
            'Webhook has been queued for redelivery. Refresh in a moment to see the new attempt.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to replay webhook.',
          variant: 'destructive',
        });
      } finally {
        setReplayingId(null);
      }
    });
  };

  const getStatusVariant = (status: number) => {
    if (status >= 500) return 'destructive';
    if (status >= 400) return 'secondary';
    if (status >= 200 && status < 300) return 'default';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Webhook Delivery Logs</CardTitle>
          <CardDescription>
            A history of recent delivery attempts for the endpoint:{' '}
            <span className="font-mono text-sm bg-muted p-1 rounded">
              {webhook.url}
            </span>
          </CardDescription>
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
                  <TableHead>Status</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Product ID</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant={getStatusVariant(log.details.statusCode)}>
                        {log.details.statusCode}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                              {log.action.includes('success') ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-destructive" />
                              )}
                              <span className="font-mono text-xs">
                                {log.details.event}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Event ID: {log.id}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.details.productId}
                    </TableCell>
                    <TableCell>{format(new Date(log.createdAt), 'PPpp')}</TableCell>
                    <TableCell className="text-right">
                      {log.action.includes('failure') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReplay(log)}
                          disabled={isReplaying}
                        >
                          {isReplaying && replayingId === log.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                          )}
                          Replay
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <WebhookIcon className="h-8 w-8 text-muted-foreground" />
                        <p>
                          No delivery attempts have been logged for this webhook
                          yet.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}