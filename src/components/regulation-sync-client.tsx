// src/components/regulation-sync-client.tsx
'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  HeartPulse,
} from 'lucide-react';
import type { RegulationSource, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  getRegulationSources,
  runHealthCheck,
  runSync,
} from '@/lib/actions/regulation-sync-actions';
import { formatDistanceToNow } from 'date-fns';

interface RegulationSyncClientProps {
  user: User;
}

const getStatusVariant = (status: RegulationSource['status']) => {
  switch (status) {
    case 'Operational':
      return 'default';
    case 'Degraded Performance':
      return 'secondary';
    case 'Offline':
      return 'destructive';
    case 'Not Implemented':
      return 'outline';
  }
};

function StatusBadge({ status }: { status: RegulationSource['status'] }) {
  return (
    <Badge variant={getStatusVariant(status)} className="capitalize">
      {status}
    </Badge>
  );
}

function RegulationCard({
  source,
  onHealthCheck,
  onSync,
  isProcessing,
  processingId,
}: {
  source: RegulationSource;
  onHealthCheck: (id: string) => void;
  onSync: (id: string) => void;
  isProcessing: boolean;
  processingId: string | null;
}) {
  const isThisOneProcessing = isProcessing && processingId === source.id;
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{source.name}</CardTitle>
          <StatusBadge status={source.status} />
        </div>
        <CardDescription>
          Type: {source.type} {source.version && `(v${source.version})`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Status</TableHead>
              <TableHead>Checklist Item</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {source.checklist.map(item => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.status ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </TableCell>
                <TableCell className="text-sm">{item.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-xs text-muted-foreground">
          Last sync:{' '}
          {source.lastSync
            ? formatDistanceToNow(new Date(source.lastSync), {
                addSuffix: true,
              })
            : 'Never'}
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onHealthCheck(source.id)}
            disabled={isThisOneProcessing}
          >
            {isThisOneProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <HeartPulse className="mr-2 h-4 w-4" />
            )}
            Health Check
          </Button>
          <Button
            size="sm"
            onClick={() => onSync(source.id)}
            disabled={isThisOneProcessing}
          >
            {isThisOneProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync Now
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function RegulationSyncClient({
  user,
}: RegulationSyncClientProps) {
  const [sources, setSources] = useState<RegulationSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(() => {
    setIsLoading(true);
    getRegulationSources(user.id)
      .then(setSources)
      .catch(err => {
        toast({
          title: 'Error',
          description:
            (err as Error).message || 'Failed to load regulation source statuses.',
          variant: 'destructive',
        });
      })
      .finally(() => setIsLoading(false));
  }, [user.id, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = useCallback(
    (
      actionFn: (id: string, userId: string) => Promise<RegulationSource>,
      sourceId: string,
      successTitle: string,
    ) => {
      setProcessingId(sourceId);
      startTransition(async () => {
        try {
          const updatedSource = await actionFn(sourceId, user.id);
          setSources(prev =>
            prev.map(s => (s.id === sourceId ? updatedSource : s)),
          );
          toast({
            title: successTitle,
            description: `Successfully processed ${updatedSource.name}.`,
          });
        } catch (err: any) {
          toast({
            title: 'Action Failed',
            description: err.message,
            variant: 'destructive',
          });
        } finally {
          setProcessingId(null);
        }
      });
    },
    [user.id, toast],
  );

  const handleHealthCheck = useCallback(
    (id: string) => {
      handleAction(runHealthCheck, id, 'Health Check Complete');
    },
    [handleAction],
  );

  const handleSync = useCallback(
    (id: string) => {
      handleAction(runSync, id, 'Sync Complete');
    },
    [handleAction],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Regulation Sync Hub</h1>
        <p className="text-muted-foreground">
          Monitor and manage the data feeds from external regulatory bodies.
        </p>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {sources.map(source => (
            <RegulationCard
              key={source.id}
              source={source}
              onHealthCheck={handleHealthCheck}
              onSync={handleSync}
              isProcessing={isProcessing}
              processingId={processingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
