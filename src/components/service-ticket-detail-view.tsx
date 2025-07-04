// src/components/service-ticket-detail-view.tsx
'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Ticket, User, Box, Factory, Calendar, FileText } from 'lucide-react';
import Image from 'next/image';

import type {
  ServiceTicket,
  User,
  Product,
  ProductionLine,
} from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { can } from '@/lib/permissions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2 } from 'lucide-react';
import { updateServiceTicketStatus } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import ServiceTicketForm from './service-ticket-form';

interface ServiceTicketDetailViewProps {
  ticket: ServiceTicket;
  user: User;
  roleSlug: string;
  products: Product[];
  productionLines: ProductionLine[];
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'Open':
      return 'destructive';
    case 'In Progress':
      return 'secondary';
    case 'Closed':
    default:
      return 'default';
  }
};

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 py-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
      <div className="flex-1">
        <p className="font-semibold">{label}</p>
        {value && <div className="text-muted-foreground text-sm">{value}</div>}
      </div>
    </div>
  );
}

export default function ServiceTicketDetailView({
  ticket: initialTicket,
  user,
  roleSlug,
  products,
  productionLines,
}: ServiceTicketDetailViewProps) {
  const [ticket, setTicket] = useState(initialTicket);
  const [isPending, startTransition] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const handleStatusUpdate = (status: 'Open' | 'In Progress' | 'Closed') => {
    startTransition(async () => {
      try {
        const updatedTicket = await updateServiceTicketStatus(
          ticket.id,
          status,
          user.id,
        );
        setTicket(updatedTicket);
        toast({
          title: 'Status Updated',
          description: `Ticket status set to ${status}.`,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update ticket status.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleSave = (savedTicket: ServiceTicket) => {
    setTicket(savedTicket);
    setIsFormOpen(false);
  };

  const canManageTicket = can(user, 'ticket:manage');
  const entity = ticket.productId
    ? products.find(p => p.id === ticket.productId)
    : productionLines.find(l => l.id === ticket.productionLineId);
  const entityType = ticket.productId ? 'product' : 'line';
  const entityName =
    entityType === 'product'
      ? (entity as Product)?.productName
      : (entity as ProductionLine)?.name;

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/${roleSlug}/tickets`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tickets
            </Link>
          </Button>
          {canManageTicket && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsFormOpen(true)}>
                Edit
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button disabled={isPending}>Update Status</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => handleStatusUpdate('Open')}
                    disabled={ticket.status === 'Open'}
                  >
                    Mark as Open
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusUpdate('In Progress')}
                    disabled={ticket.status === 'In Progress'}
                  >
                    Mark as In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusUpdate('Closed')}
                    disabled={ticket.status === 'Closed'}
                  >
                    Mark as Closed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        <header className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 bg-muted p-3 rounded-full">
              <Ticket className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Ticket: {ticket.id}
              </h1>
              <div className="flex items-center gap-2 mt-1 text-sm">
                <Badge variant={getStatusVariant(ticket.status)}>
                  {ticket.status}
                </Badge>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground" suppressHydrationWarning>
                  Opened {formatDistanceToNow(new Date(ticket.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Issue Details</CardTitle>
              </CardHeader>
              <CardContent>
                <InfoRow icon={User} label="Requester" value={ticket.customerName} />
                <InfoRow
                  icon={entityType === 'product' ? Box : Factory}
                  label={entityType === 'product' ? 'Product' : 'Production Line'}
                  value={entityName}
                />
                <InfoRow icon={Calendar} label="Created At" value={format(new Date(ticket.createdAt), "PPP p")} />
                <InfoRow icon={FileText} label="Issue Description" value={ticket.issue} />
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-1">
             {ticket.imageUrl && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Attached Image</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Image
                            src={ticket.imageUrl}
                            alt="Issue image"
                            width={400}
                            height={300}
                            className="rounded-md border object-cover w-full"
                        />
                    </CardContent>
                </Card>
             )}
          </div>
        </div>
      </div>
      {canManageTicket && (
        <ServiceTicketForm
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          ticket={ticket}
          onSave={() => handleSave(ticket)}
          user={user}
          products={products}
          productionLines={productionLines}
        />
      )}
    </>
  );
}
