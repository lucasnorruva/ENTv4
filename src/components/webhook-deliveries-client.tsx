// src/components/webhook-deliveries-client.tsx
'use client';

import React, { useState, useTransition } from 'react';
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
  Clock,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import type { Webhook, AuditLog, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { replayWebhook } from '@/lib/actions';

interface WebhookDeliveriesClientProps {
  webhook: Webhook;
  initialLogs: AuditLog[];
  user: User;
}

export default function WebhookDeliveriesClient({
  webhook,
  initialLogs,
  user,
}: WebhookDeliveriesClientProps) {
  const [logs] = useState(initialLogs);
  const [isReplaying, startReplayTransition] = useTransition();
  const { toast } = useToast();

  const handleReplay = (log: AuditLog) => {
    startReplayTransition(async () => {
      toast({
        title: 'Replaying webhook...',
        description: `Attempting to redeliver event for product ${log.details.productId}.`,
      });
      try {
        await replayWebhook(log.id, user.id);
        toast({
          title: 'Success',
          description: 'Webhook has been queued for redelivery.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to replay webhook.',
          variant: 'destructive',
        });
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
                  <TableCell>{format(new Date(log.createdAt), 'PPpp')}</TableCell>
                  <TableCell className="text-right">
                    {log.action.includes('failure') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReplay(log)}
                        disabled={isReplaying}
                      >
                        {isReplaying ? (
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
                    No delivery attempts have been logged for this webhook yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
