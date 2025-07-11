// src/components/regulation-sync-client.tsx
'use client';

import React, { useState, useEffect, useTransition, useCallback, useMemo } from 'react';
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
  Clock,
  FlaskConical,
  ShieldAlert,
} from 'lucide-react';
import type { Product, RegulationSource, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  getRegulationSources,
  runHealthCheck,
  runSync,
  runTemporalComplianceCheck,
  getProducts,
} from '@/lib/actions';
import { formatDistanceToNow } from 'date-fns';
import { ProductTrackerSelector } from './dpp-tracker/product-tracker-selector';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

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
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [timeMachineProduct, setTimeMachineProduct] = useState<string | null>(null);
  const [timeMachineResult, setTimeMachineResult] = useState<Awaited<ReturnType<typeof runTemporalComplianceCheck>> | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(() => {
    setIsLoading(true);
    Promise.all([
      getRegulationSources(user.id),
      getProducts(user.id)
    ]).then(([fetchedSources, fetchedProducts]) => {
      setSources(fetchedSources);
      setProducts(fetchedProducts);
    }).catch(err => {
        toast({
          title: 'Error',
          description:
            (err as Error).message || 'Failed to load initial data.',
          variant: 'destructive',
        });
    }).finally(() => setIsLoading(false));
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
  
  const handleTimeMachineRun = useCallback((scenario: 'past' | 'present' | 'future') => {
    if (!timeMachineProduct) {
        toast({ title: "Please select a product.", variant: 'destructive' });
        return;
    }
    setProcessingId(`time-machine-${scenario}`);
    startTransition(async () => {
        try {
            const result = await runTemporalComplianceCheck(timeMachineProduct, scenario, user.id);
            setTimeMachineResult(result);
        } catch(err: any) {
            toast({ title: 'Analysis Failed', description: err.message, variant: 'destructive' });
        } finally {
            setProcessingId(null);
        }
    });
  }, [timeMachineProduct, user.id, toast]);

  const timeMachineCardDescription = useMemo(() => {
    if (!timeMachineResult) return 'Select a product and run an analysis to see results.';
    const { scenario, isCompliant, gaps } = timeMachineResult;
    const gapsText = gaps.length > 0 ? `${gaps.length} gaps found.` : 'No gaps found.';
    return `Analysis for '${scenario}' scenario complete. Product would ${isCompliant ? 'PASS' : 'FAIL'} compliance. ${gapsText}`;
  }, [timeMachineResult]);


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Regulation Hub</h1>
        <p className="text-muted-foreground">
          Monitor data feeds and run advanced regulatory simulations.
        </p>
      </div>

       <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5"/> Regulatory Time Machine
            </CardTitle>
            <CardDescription>
                Analyze how a product would comply under past, present, or future regulations.
            </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <ProductTrackerSelector products={products} selectedProductId={timeMachineProduct} onProductSelect={setTimeMachineProduct} />
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button className="w-full" variant="outline" onClick={() => handleTimeMachineRun('past')} disabled={isProcessing || !timeMachineProduct}>
                        {isProcessing && processingId === 'time-machine-past' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        Analyze Past (2022)
                    </Button>
                    <Button className="w-full" variant="outline" onClick={() => handleTimeMachineRun('present')} disabled={isProcessing || !timeMachineProduct}>
                        {isProcessing && processingId === 'time-machine-present' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        Analyze Present
                    </Button>
                    <Button className="w-full" variant="outline" onClick={() => handleTimeMachineRun('future')} disabled={isProcessing || !timeMachineProduct}>
                       {isProcessing && processingId === 'time-machine-future' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        Analyze Future (2026)
                    </Button>
                </div>
            </div>
            <Alert variant={timeMachineResult && !timeMachineResult.isCompliant ? "destructive" : "default"}>
                <FlaskConical className="h-4 w-4"/>
                <AlertTitle>Analysis Results</AlertTitle>
                <AlertDescription>
                   {timeMachineCardDescription}
                   {timeMachineResult && timeMachineResult.gaps.length > 0 && (
                     <ul className="mt-2 text-xs list-disc list-inside">
                       {timeMachineResult.gaps.map((gap, i) => <li key={i}>{gap.issue}</li>)}
                     </ul>
                   )}
                </AlertDescription>
            </Alert>
        </CardContent>
      </Card>


      <h2 className="text-xl font-semibold border-t pt-6">Data Source Status</h2>
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
