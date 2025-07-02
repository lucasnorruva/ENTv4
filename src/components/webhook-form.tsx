// src/components/webhook-form.tsx
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveWebhook } from '@/lib/actions';
import { webhookFormSchema, type WebhookFormValues } from '@/lib/schemas';
import type { Webhook, User } from '@/types';

interface WebhookFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  webhook: Webhook | null;
  onSave: (webhook: Webhook) => void;
  user: User;
}

const availableEvents = [
  {
    id: 'product.published',
    label: 'Product Published',
    description: 'Triggered when a product status is changed to "Published".',
  },
  {
    id: 'product.updated',
    label: 'Product Updated',
    description: 'Triggered when any product data is changed.',
  },
  {
    id: 'compliance.failed',
    label: 'Compliance Failed',
    description: 'Triggered when a product fails a compliance check.',
  },
];

export default function WebhookForm({
  isOpen,
  onOpenChange,
  webhook,
  onSave,
  user,
}: WebhookFormProps) {
  const [isSaving, startSavingTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<WebhookFormValues>({
    resolver: zodResolver(webhookFormSchema),
    defaultValues: {
      url: '',
      events: [],
      status: 'active',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (webhook) {
        form.reset({
          url: webhook.url,
          events: webhook.events,
          status: webhook.status,
        });
      } else {
        form.reset({
          url: '',
          events: [],
          status: 'active',
        });
      }
    }
  }, [webhook, isOpen, form]);

  const onSubmit = (values: WebhookFormValues) => {
    startSavingTransition(async () => {
      try {
        const saved = await saveWebhook(values, user.id, webhook?.id);
        toast({
          title: 'Success!',
          description: `Webhook for "${saved.url}" has been saved.`,
        });
        onSave(saved);
        onOpenChange(false);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to save the webhook.',
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
            {webhook ? 'Edit Webhook' : 'Create Webhook'}
          </DialogTitle>
          <DialogDescription>
            Configure an endpoint to receive real-time event notifications from
            Norruva.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endpoint URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://api.example.com/hooks"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="events"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Events to Subscribe To</FormLabel>
                    <FormDescription>
                      Select which events should trigger this webhook.
                    </FormDescription>
                  </div>
                  {availableEvents.map(item => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name="events"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={item.id}
                            className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-md"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={checked => {
                                  return checked
                                    ? field.onChange([
                                        ...(field.value || []),
                                        item.id,
                                      ])
                                    : field.onChange(
                                        field.value?.filter(
                                          value => value !== item.id,
                                        ),
                                      );
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>{item.label}</FormLabel>
                              <FormDescription>
                                {item.description}
                              </FormDescription>
                            </div>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
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
                {isSaving ? 'Saving...' : 'Save Webhook'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
