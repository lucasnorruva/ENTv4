// src/components/service-ticket-form.tsx
'use client';

import React, { useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveServiceTicket } from '@/lib/actions';
import {
  serviceTicketFormSchema,
  type ServiceTicketFormValues,
} from '@/lib/schemas';
import type { ServiceTicket, User, Product } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface ServiceTicketFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  ticket: ServiceTicket | null;
  onSave: () => void;
  user: User;
  products: Product[];
}

export default function ServiceTicketForm({
  isOpen,
  onOpenChange,
  ticket,
  onSave,
  user,
  products,
}: ServiceTicketFormProps) {
  const [isSaving, startSavingTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<ServiceTicketFormValues>({
    resolver: zodResolver(serviceTicketFormSchema),
    defaultValues: {
      productId: '',
      customerName: '',
      issue: '',
      status: 'Open',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (ticket) {
        form.reset({
          productId: ticket.productId,
          customerName: ticket.customerName,
          issue: ticket.issue,
          status: ticket.status,
        });
      } else {
        form.reset({
          productId: '',
          customerName: '',
          issue: '',
          status: 'Open',
        });
      }
    }
  }, [ticket, isOpen, form]);

  const onSubmit = (values: ServiceTicketFormValues) => {
    startSavingTransition(async () => {
      try {
        const saved = await saveServiceTicket(values, user.id, ticket?.id);
        toast({
          title: 'Success!',
          description: `Service ticket ${ticket ? 'updated' : 'created'}.`,
        });
        onSave();
        onOpenChange(false);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to save the service ticket.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {ticket ? 'Edit Service Ticket' : 'Create Service Ticket'}
          </DialogTitle>
          <DialogDescription>
            {ticket
              ? 'Update the details for this service request.'
              : 'Log a new service request for a customer.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.productName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="issue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the issue reported by the customer..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? 'Saving...' : 'Save Ticket'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}