// src/components/service-ticket-form.tsx
'use client';

import React, { useEffect, useTransition, useState } from 'react';
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
import type { ServiceTicket, User, Product, ProductionLine } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

interface ServiceTicketFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  ticket: ServiceTicket | null;
  onSave: () => void;
  user: User;
  products: Product[];
  productionLines: ProductionLine[];
}

type TicketType = 'product' | 'line';

export default function ServiceTicketForm({
  isOpen,
  onOpenChange,
  ticket,
  onSave,
  user,
  products,
  productionLines,
}: ServiceTicketFormProps) {
  const [isSaving, startSavingTransition] = useTransition();
  const [ticketType, setTicketType] = useState<TicketType>('product');
  const { toast } = useToast();

  const form = useForm<ServiceTicketFormValues>({
    resolver: zodResolver(serviceTicketFormSchema),
    defaultValues: {
      productId: '',
      productionLineId: '',
      customerName: '',
      issue: '',
      status: 'Open',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (ticket) {
        setTicketType(ticket.productionLineId ? 'line' : 'product');
        form.reset({
          productId: ticket.productId || '',
          productionLineId: ticket.productionLineId || '',
          customerName: ticket.customerName,
          issue: ticket.issue,
          status: ticket.status,
        });
      } else {
        setTicketType('product');
        form.reset({
          productId: '',
          productionLineId: '',
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
        const payload = {
          ...values,
          productId: ticketType === 'product' ? values.productId : undefined,
          productionLineId:
            ticketType === 'line' ? values.productionLineId : undefined,
        };
        const saved = await saveServiceTicket(payload, user.id, ticket?.id);
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
              : 'Log a new service request for a customer or production line.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormItem>
              <FormLabel>Ticket Type</FormLabel>
              <RadioGroup
                value={ticketType}
                onValueChange={(value: TicketType) => setTicketType(value)}
                className="flex gap-4"
              >
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="product" id="r1" />
                  </FormControl>
                  <FormLabel htmlFor="r1">Product</FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="line" id="r2" />
                  </FormControl>
                  <FormLabel htmlFor="r2">Production Line</FormLabel>
                </FormItem>
              </RadioGroup>
            </FormItem>

            {ticketType === 'product' ? (
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
            ) : (
              <FormField
                control={form.control}
                name="productionLineId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Production Line</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a production line" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productionLines.map(l => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requester / Customer Name</FormLabel>
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
