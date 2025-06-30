// src/app/dashboard/developer/integrations/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
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
import { Cog } from 'lucide-react';

// Mock data for integrations
const integrations = {
  erp: [
    {
      name: 'SAP S/4HANA',
      logo: 'https://placehold.co/40x40.png',
      description: 'Sync product master data directly from your SAP system.',
      dataAiHint: 'sap logo',
    },
    {
      name: 'Oracle NetSuite',
      logo: 'https://placehold.co/40x40.png',
      description: 'Automate DPP creation from NetSuite item records.',
      dataAiHint: 'oracle logo',
    },
  ],
  plm: [
    {
      name: 'Siemens Teamcenter',
      logo: 'https://placehold.co/40x40.png',
      description: 'Link engineering and design data from Teamcenter.',
      dataAiHint: 'siemens logo',
    },
  ],
  ecommerce: [
    {
      name: 'Shopify',
      logo: 'https://placehold.co/40x40.png',
      description: 'Embed DPP QR codes on your Shopify product pages.',
      dataAiHint: 'shopify logo',
    },
  ],
};

function IntegrationCard({
  name,
  logo,
  description,
  dataAiHint,
}: {
  name: string;
  logo: string;
  description: string;
  dataAiHint: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <Image
          src={logo}
          alt={`${name} logo`}
          width={40}
          height={40}
          data-ai-hint={dataAiHint}
        />
        <div>
          <CardTitle>{name}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardFooter className="flex justify-between">
        <div className="flex items-center space-x-2">
          <Switch id={`${name}-switch`} />
          <Label htmlFor={`${name}-switch`}>Enable</Label>
        </div>
        <Button variant="outline" size="sm">
          <Cog className="mr-2 h-4 w-4" />
          Configure
        </Button>
      </CardFooter>
    </Card>
  );
}

export default async function IntegrationsPage() {
  const user = await getCurrentUser(UserRoles.DEVELOPER);

  const allowedRoles = [UserRoles.ADMIN, UserRoles.DEVELOPER];

  if (!allowedRoles.some(role => hasRole(user, role))) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">
          Connect Norruva with your existing enterprise systems to automate
          data flows.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">ERP Systems</h2>
          <p className="text-sm text-muted-foreground">
            Synchronize product data, bill of materials, and supply chain
            information.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.erp.map(int => (
            <IntegrationCard key={int.name} {...int} />
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
          {integrations.plm.map(int => (
            <IntegrationCard key={int.name} {...int} />
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
          {integrations.ecommerce.map(int => (
            <IntegrationCard key={int.name} {...int} />
          ))}
        </div>
      </div>
    </div>
  );
}
