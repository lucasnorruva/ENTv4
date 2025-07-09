// src/components/support-ticket-management-client.tsx
'use client';

import React, { useState, useTransition, useEffect, useCallback } from 'react';
import {
  MoreHorizontal,
  Loader2,
  MailQuestion,
  Check,
  RotateCcw,
} from 'lucide-react';
import { format } from 'date-fns';

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
} from '@/components/ui/dropdown-menu';

import type { SupportTicket, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  getSupportTickets,
  updateSupportTicketStatus,
} from '@/lib/actions/ticket-actions';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';

const getStatusVariant = (status: string) => {
  return status === 'Open' ? 'destructive' : 'default';
};

interface SupportTicketManagementClientProps {
  user: User;
}

export default function SupportTicketManagementClient({
  user,
}: SupportTicketManagementClientProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fetchData = useCallback(() => {
    setIsLoading(true);
    getSupportTickets()
      .then(setTickets)
      .catch(() =>
        toast({
          title: 'Error',
          description: 'Failed to load support tickets.',
          variant: 'destructive',
        }),
      )
      .finally(() => setIsLoading(false));
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusUpdate = useCallback(
    (ticketId: string, status: 'Open' | 'Closed') => {
      startTransition(async () => {
        try {
          const updatedTicket = await updateSupportTicketStatus(
            ticketId,
            status,
            user.id,
          );
          setTickets(prev =>
            prev.map(t => (t.id === ticketId ? updatedTicket : t)),
          );
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
    },
    [user.id, toast],
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Support Tickets</CardTitle>
        <CardDescription>
          View and manage all incoming user support requests.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>From</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length > 0 ? (
              tickets.map(ticket => (
                <React.Fragment key={ticket.id}>
                  <TableRow>
                    <TableCell>
                      <Badge variant={getStatusVariant(ticket.status)}>
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {ticket.subject}
                    </TableCell>
                    <TableCell>
                      {ticket.name} ({ticket.email})
                    </TableCell>
                    <TableCell>
                      {format(new Date(ticket.createdAt), 'PPP')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isPending}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {ticket.status === 'Closed' && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusUpdate(ticket.id, 'Open')
                              }
                            >
                              <RotateCcw className="mr-2 h-4 w-4" /> Re-open
                              Ticket
                            </DropdownMenuItem>
                          )}
                          {ticket.status === 'Open' && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusUpdate(ticket.id, 'Closed')
                              }
                            >
                              <Check className="mr-2 h-4 w-4" /> Close Ticket
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Accordion type="single" collapsible>
                        <AccordionItem value="message">
                          <AccordionTrigger className="text-xs">
                            View Message
                          </AccordionTrigger>
                          <AccordionContent className="p-4 bg-muted/50 rounded-md text-sm">
                            {ticket.message}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <MailQuestion className="h-12 w-12 text-muted-foreground" />
                    <h3 className="text-xl font-semibold">
                      No Support Tickets
                    </h3>
                    <p className="text-muted-foreground">
                      The support queue is currently empty.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
