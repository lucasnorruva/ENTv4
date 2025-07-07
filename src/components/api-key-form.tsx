// src/components/api-key-form.tsx
'use client';

import React, { useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { saveApiKey } from '@/lib/actions/api-key-actions';
import { apiKeyFormSchema, type ApiKeyFormValues } from '@/lib/schemas';
import type { ApiKey, User } from '@/types';
import { cn } from '@/lib/utils';

// Pre-defined scopes for the platform
const AVAILABLE_SCOPES = [
  { id: 'product:read', label: 'Read Products' },
  { id: 'product:write', label: 'Write Products' },
  { id: 'compliance:read', label: 'Read Compliance Data' },
  { id: 'compliance:write', label: 'Write Compliance Data' },
];

interface ApiKeyFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  apiKey: ApiKey | null;
  onSave: (result: { key: ApiKey; rawToken?: string }) => void;
  user: User;
}

export default function ApiKeyForm({
  isOpen,
  onOpenChange,
  apiKey,
  onSave,
  user,
}: ApiKeyFormProps) {
  const [isSaving, startSavingTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeyFormSchema),
    defaultValues: {
      label: '',
      scopes: [],
      ipRestrictions: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (apiKey) {
        form.reset({
          label: apiKey.label,
          scopes: apiKey.scopes || [],
          expiresAt: apiKey.expiresAt ? new Date(apiKey.expiresAt) : undefined,
          ipRestrictions: apiKey.ipRestrictions?.join(', ') || '',
        });
      } else {
        form.reset({
          label: '',
          scopes: ['product:read'], // Default scope
          expiresAt: undefined,
          ipRestrictions: '',
        });
      }
    }
  }, [apiKey, isOpen, form]);

  const onSubmit = (values: ApiKeyFormValues) => {
    startSavingTransition(async () => {
      try {
        const result = await saveApiKey(values, user.id, apiKey?.id);
        toast({
          title: 'Success!',
          description: `API Key "${result.key.label}" has been saved.`,
        });
        onSave(result);
        onOpenChange(false);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to save the API key.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{apiKey ? 'Edit API Key' : 'Create API Key'}</DialogTitle>
          <DialogDescription>
            API keys grant access to the Norruva API. Use scopes to limit access
            to specific resources.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Production Server Key" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="scopes"
                  render={() => (
                    <FormItem>
                      <FormLabel>Scopes</FormLabel>
                      <div className="space-y-2 border rounded-md p-3 min-h-[160px]">
                        {AVAILABLE_SCOPES.map(item => (
                          <FormField
                            key={item.id}
                            control={form.control}
                            name="scopes"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={item.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
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
                                  <FormLabel className="font-normal">
                                    {item.label}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-6">
                    <FormField
                    control={form.control}
                    name="expiresAt"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Expiration Date (Optional)</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="ipRestrictions"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>IP Restrictions (Optional)</FormLabel>
                        <FormControl>
                            <Textarea
                            placeholder="e.g. 203.0.113.42, 198.51.100.0/24"
                            {...field}
                            />
                        </FormControl>
                        <FormDescription>
                            Comma-separated list of IP addresses or CIDR blocks.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
            </div>

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? 'Saving...' : 'Save API Key'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
