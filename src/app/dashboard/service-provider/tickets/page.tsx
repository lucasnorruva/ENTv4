// src/app/dashboard/service-provider/tickets/page.tsx
'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { MoreHorizontal, Plus, Loader2, Edit, Ticket } from 'lucide-react';

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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

import type { ServiceTicket, User, Product } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  updateServiceTicketStatus,
  getProducts,
  getServiceTickets,
} from '@/lib/actions';
import ServiceTicketForm from '@/components/service-ticket-form';
import { format } from 'date-fns';
import { getCurrentUser } from '@/lib/auth-client';

export default function ServiceTicketsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchInitialData() {
      setIsLoading(true);
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) throw new Error('User not found');
        setUser(currentUser);
        const [fetchedProducts, fetchedTickets] = await Promise.all([
          getProducts(currentUser.id),
          getServiceTickets(),
        ]);

        setProducts(fetchedProducts);
        setTickets(
          fetchedTickets.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime(),
          ),
        );
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load initial data.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchInitialData();
  }, [toast, isPending]); // Re-fetch on actions

  const handleCreateNew = () => {
    setSelectedTicket(null);
    setIsFormOpen(true);
  };

  const handleEdit = (ticket: ServiceTicket) => {
    setSelectedTicket(ticket);
    setIsFormOpen(true);
  };

  const handleStatusUpdate = (
    ticketId: string,
    status: 'Open' | 'In Progress' | 'Closed',
  ) => {
    if (!user) return;
    startTransition(async () => {
      try {
        await updateServiceTicketStatus(ticketId, status, user.id);
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

  const handleSave = () => {
    setIsFormOpen(false);
  };

  const productMap = new Map(products.map(p => [p.id, p.productName]));

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

  if (!user) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Service Tickets</CardTitle>
              <CardDescription>
                View and manage all active and past service tickets for
                products.
              </CardDescription>
            </div>
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" /> Create Ticket
            </Button>
          </div>
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
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map(ticket => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-xs">
                      {ticket.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {productMap.get(ticket.productId) || 'Unknown Product'}
                    </TableCell>
                    <TableCell>{ticket.customerName}</TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {ticket.issue}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(ticket.status)}>
                        {ticket.status}
                      </Badge>
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
                          <DropdownMenuItem onClick={() => handleEdit(ticket)}>
                            <Edit className="mr-2 h-4 w-4" />
                            View/Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusUpdate(ticket.id, 'Open')
                            }
                            disabled={ticket.status === 'Open'}
                          >
                            Mark as Open
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusUpdate(ticket.id, 'In Progress')
                            }
                            disabled={ticket.status === 'In Progress'}
                          >
                            Mark as In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusUpdate(ticket.id, 'Closed')
                            }
                            disabled={ticket.status === 'Closed'}
                          >
                            Mark as Closed
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {tickets.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <Ticket className="h-12 w-12 text-muted-foreground" />
                        <h3 className="text-xl font-semibold">
                          No Service Tickets
                        </h3>
                        <p className="text-muted-foreground">
                          Create the first service ticket to get started.
                        </p>
                        <Button onClick={handleCreateNew}>
                          Create Ticket
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <ServiceTicketForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        ticket={selectedTicket}
        onSave={handleSave}
        user={user}
        products={products}
      />
    </>
  );
}