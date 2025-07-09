// src/components/integration-management-client.tsx
'use client';

import React, { useState, useTransition, useEffect, useCallback } from 'react';
import type { Integration, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  getIntegrations,
  updateIntegrationStatus,
} from '@/lib/actions/integration-actions';
import { syncWithErp } from '@/lib/actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import {
  Loader2,
  RefreshCw,
  Cog,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { can } from '@/lib/permissions';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from './ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface IntegrationManagementClientProps {
  user: User;
}

const getStatusBadgeVariant = (
  status: Integration['status'],
): 'default' | 'destructive' | 'secondary' => {
  switch (status) {
    case 'Connected':
      return 'default';
    case 'Error':
      return 'destructive';
    case 'Disconnected':
    default:
      return 'secondary';
  }
};
const getStatusIcon = (status: Integration['status']) => {
  switch (status) {
    case 'Connected':
      return <CheckCircle className="h-3 w-3 mr-1" />;
    case 'Error':
      return <AlertTriangle className="h-3 w-3 mr-1" />;
    case 'Disconnected':
    default:
      return <XCircle className="h-3 w-3 mr-1" />;
  }
};

function IntegrationCard({
  integration,
  onStatusChange,
  onSync,
  isPending,
  isSyncing,
  canSync,
}: {
  integration: Integration;
  onStatusChange: (id: string, enabled: boolean) => void;
  onSync: (name: string) => void;
  isPending: boolean;
  isSyncing: boolean;
  canSync: boolean;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <Image
          src={integration.logo}
          alt={`${integration.name} logo`}
          width={40}
          height={40}
          data-ai-hint={integration.dataAiHint}
        />
        <div>
          <CardTitle>{integration.name}</CardTitle>
          <CardDescription>{integration.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="text-sm text-muted-foreground space-y-2 border-t pt-4">
          <div className="flex justify-between">
            <span>Status:</span>
            <Badge variant={getStatusBadgeVariant(integration.status)}>
              {getStatusIcon(integration.status)}
              {integration.status}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Last Sync:</span>
            <span suppressHydrationWarning>
              {integration.lastSync
                ? formatDistanceToNow(new Date(integration.lastSync), {
                    addSuffix: true,
                  })
                : 'Never'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Records Synced:</span>
            <span>{integration.recordsSynced ?? 0}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t pt-4">
        <div className="flex items-center space-x-2">
          <Switch
            id={`${integration.id}-switch`}
            checked={integration.enabled}
            onCheckedChange={checked =>
              onStatusChange(integration.id, checked)
            }
            disabled={isPending}
          />
          <Label htmlFor={`${integration.id}-switch`}>
            {integration.enabled ? 'Enabled' : 'Disabled'}
          </Label>
        </div>
        <div className="flex gap-2">
          {canSync && integration.type === 'ERP' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSync(integration.name)}
                    disabled={isPending || !integration.enabled}
                  >
                    {isSyncing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Sync
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Trigger a manual data sync.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button variant="secondary" size="sm" disabled>
                    <Cog className="mr-2 h-4 w-4" />
                    Configure
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Advanced configuration (coming soon).</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function IntegrationManagementClient({
  user,
}: IntegrationManagementClientProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [syncingIntegration, setSyncingIntegration] = useState<string | null>(
    null,
  );
  const { toast } = useToast();

  const canSync = can(user, 'integration:sync');

  const fetchIntegrations = useCallback(() => {
    setIsLoading(true);
    getIntegrations(user.id)
      .then(setIntegrations)
      .catch(() =>
        toast({
          title: 'Error',
          description: 'Failed to load integrations.',
          variant: 'destructive',
        }),
      )
      .finally(() => setIsLoading(false));
  }, [user.id, toast]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const handleStatusChange = (id: string, enabled: boolean) => {
    startTransition(async () => {
      try {
        const updated = await updateIntegrationStatus(id, enabled, user.id);
        setIntegrations(prev => prev.map(i => (i.id === id ? updated : i)));
        toast({
          title: `Integration ${enabled ? 'Enabled' : 'Disabled'}`,
          description: `${updated.name} has been updated.`,
        });
      } catch (error) {
        toast({
          title: 'Update Failed',
          description: 'Could not update the integration status.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleSync = (name: string) => {
    setSyncingIntegration(name);
    startTransition(async () => {
      try {
        const result = await syncWithErp(name, user.id);
        toast({
          title: 'Sync Complete',
          description: `Synced ${result.createdCount} new and ${result.updatedCount} existing products from ${name}.`,
        });
        // Refetch integrations to update sync stats
        fetchIntegrations();
      } catch (error: any) {
        toast({
          title: 'Sync Failed',
          description:
            error.message || 'An error occurred during synchronization.',
          variant: 'destructive',
        });
      } finally {
        setSyncingIntegration(null);
      }
    });
  };

  const integrationGroups = {
    'ERP Systems': {
      description:
        'Synchronize product data, bill of materials, and supply chain information.',
      integrations: integrations.filter(i => i.type === 'ERP'),
    },
    'PLM Systems': {
      description: 'Pull in design specifications and engineering data.',
      integrations: integrations.filter(i => i.type === 'PLM'),
    },
    'E-commerce Platforms': {
      description:
        'Connect your online store to display DPPs to customers.',
      integrations: integrations.filter(i => i.type === 'E-commerce'),
    },
    'CRM Systems': {
        description: 'Link product data to customer accounts and service cases.',
        integrations: integrations.filter(i => i.type === 'CRM'),
    },
    'Cloud Storage': {
        description: 'Automatically import compliance documents and certificates.',
        integrations: integrations.filter(i => i.type === 'Cloud Storage'),
    },
    'Analytics & BI': {
        description: 'Push DPP data to business intelligence platforms for advanced reporting.',
        integrations: integrations.filter(i => i.type === 'Analytics'),
    },
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(integrationGroups).map(
        ([title, { description, integrations }]) =>
          integrations.length > 0 && (
            <div key={title} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">{title}</h2>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {integrations.map(int => (
                  <IntegrationCard
                    key={int.id}
                    integration={int}
                    onStatusChange={handleStatusChange}
                    onSync={handleSync}
                    isPending={isPending}
                    isSyncing={syncingIntegration === int.name}
                    canSync={canSync}
                  />
                ))}
              </div>
            </div>
          ),
      )}
    </div>
  );
}
