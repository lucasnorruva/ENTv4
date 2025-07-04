// src/components/integration-management-client.tsx
'use client';

import React, { useState, useTransition, useEffect } from 'react';
import type { Integration, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getIntegrations, updateIntegrationStatus } from '@/lib/actions';

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
import { Cog, Loader2 } from 'lucide-react';

interface IntegrationManagementClientProps {
  user: User;
}

function IntegrationCard({
  integration,
  onStatusChange,
  isPending,
}: {
  integration: Integration;
  onStatusChange: (id: string, enabled: boolean) => void;
  isPending: boolean;
}) {
  return (
    <Card>
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
      <CardFooter className="flex justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id={`${integration.id}-switch`}
            checked={integration.enabled}
            onCheckedChange={checked =>
              onStatusChange(integration.id, checked)
            }
            disabled={isPending}
          />
          <Label htmlFor={`${integration.id}-switch`}>Enable</Label>
        </div>
        <Button variant="outline" size="sm" disabled>
          <Cog className="mr-2 h-4 w-4" />
          Configure
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function IntegrationManagementClient({ user }: IntegrationManagementClientProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
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

  const handleStatusChange = (id: string, enabled: boolean) => {
    startTransition(async () => {
      try {
        const updated = await updateIntegrationStatus(id, enabled, user.id);
        setIntegrations(prev =>
          prev.map(i => (i.id === id ? updated : i)),
        );
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

  const erpIntegrations = integrations.filter(i => i.type === 'ERP');
  const plmIntegrations = integrations.filter(i => i.type === 'PLM');
  const ecommerceIntegrations = integrations.filter(i => i.type === 'E-commerce');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">ERP Systems</h2>
          <p className="text-sm text-muted-foreground">
            Synchronize product data, bill of materials, and supply chain
            information.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {erpIntegrations.map(int => (
            <IntegrationCard
              key={int.id}
              integration={int}
              onStatusChange={handleStatusChange}
              isPending={isPending}
            />
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">PLM Systems</h2>
          <p className="text-sm text-muted-foreground">
            Pull in design specifications and engineering data.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plmIntegrations.map(int => (
            <IntegrationCard
              key={int.id}
              integration={int}
              onStatusChange={handleStatusChange}
              isPending={isPending}
            />
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">E-commerce Platforms</h2>
          <p className="text-sm text-muted-foreground">
            Connect your online store to display DPPs to customers.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ecommerceIntegrations.map(int => (
            <IntegrationCard
              key={int.id}
              integration={int}
              onStatusChange={handleStatusChange}
              isPending={isPending}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
