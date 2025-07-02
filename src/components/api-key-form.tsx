// src/components/api-key-form.tsx
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
import { saveApiKey } from '@/lib/actions';
import { apiKeyFormSchema, type ApiKeyFormValues } from '@/lib/schemas';
import type { ApiKey, User } from '@/types';

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
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (apiKey) {
        form.reset({
          label: apiKey.label,
          scopes: apiKey.scopes || [],
        });
      } else {
        form.reset({
          label: '',
          scopes: ['product:read'], // Default scope
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
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{apiKey ? 'Edit API Key' : 'Create API Key'}</DialogTitle>
          <DialogDescription>
            API keys grant access to the Norruva API. Use scopes to limit access
            to specific resources.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <FormField
              control={form.control}
              name="scopes"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Scopes</FormLabel>
                    <FormDescription>
                      Select the permissions this key will have.
                    </FormDescription>
                  </div>
                  <div className="space-y-2">
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
