// src/components/webhook-deliveries-client.tsx
'use client';

import React, {
  useState,
  useTransition,
  useEffect,
  useCallback,
} from 'react';
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
import { replayWebhook } from '@/lib/actions/webhook-actions';
import { getAuditLogsForEntity } from '@/lib/actions/audit-actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from './ui/scroll-area';

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
  const [viewingPayload, setViewingPayload] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    getAuditLogsForEntity(webhook.id)
      .then(logsData => {
        const deliveryLogs = logsData.filter(log =>
          log.action.startsWith('webhook.delivery'),
        );
        setLogs(deliveryLogs);
      })
      .catch(err => {
        console.error('Error fetching delivery logs:', err);
        toast({
          title: 'Error',
          description: 'Could not load webhook delivery history.',
          variant: 'destructive',
        });
      })
      .finally(() => setIsLoading(false));
  }, [webhook.id, toast]);

  const handleReplay = useCallback((log: AuditLog) => {
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
  }, [user.id, toast, startReplayTransition]);

  const getStatusVariant = (status: number) => {
    if (status >= 500) return 'destructive';
    if (status >= 400) return 'secondary';
    if (status >= 200 && status < 300) return 'default';
    return 'outline';
  };

  return (
    <>
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
                    <TableHead>Payload</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge
                          variant={getStatusVariant(log.details.statusCode)}
                        >
                          {log.details.statusCode}
                        </Badge>
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.details.productId}
                      </TableCell>
                      <TableCell>
                        {log.details.payload ? (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0"
                            onClick={() => setViewingPayload(log.details.payload)}
                          >
                            View Payload
                          </Button>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(log.createdAt), 'PPpp')}
                      </TableCell>
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
                      <TableCell colSpan={6} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <WebhookIcon className="h-8 w-8 text-muted-foreground" />
                          <p>
                            No delivery attempts have been logged for this
                            webhook yet.
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

        <Dialog
          open={!!viewingPayload}
          onOpenChange={() => setViewingPayload(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Webhook Payload</DialogTitle>
              <DialogDescription>
                The exact JSON payload sent to the endpoint.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-96 w-full rounded-md border bg-muted p-4">
              <pre className="text-xs">
                {viewingPayload
                  ? JSON.stringify(JSON.parse(viewingPayload), null, 2)
                  : ''}
              </pre>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
