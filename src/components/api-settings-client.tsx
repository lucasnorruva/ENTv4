'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { saveApiSettings } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { ApiSettings, User } from '@/types';
import {
  apiSettingsSchema,
  type ApiSettingsFormValues,
} from '@/lib/schemas';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

interface ApiSettingsClientProps {
  initialSettings: ApiSettings;
  user: User;
}

export default function ApiSettingsClient({
  initialSettings,
  user,
}: ApiSettingsClientProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<ApiSettingsFormValues>({
    resolver: zodResolver(apiSettingsSchema),
    defaultValues: initialSettings,
  });

  const onSubmit = (values: ApiSettingsFormValues) => {
    startTransition(async () => {
      try {
        await saveApiSettings(values, user.id);
        toast({
          title: 'Settings Saved',
          description: 'The API settings have been successfully updated.',
        });
      } catch (error) {
        toast({
          title: 'Error Saving Settings',
          description: 'An unexpected error occurred.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General API Configuration</CardTitle>
            <CardDescription>
              Manage the availability and rate limits for the public API.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="isPublicApiEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Enable Public API</FormLabel>
                    <FormDescription>
                      Allow unauthenticated access to public product passport
                      data.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rateLimitPerMinute"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate Limit (Requests per Minute)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      className="max-w-xs"
                      onChange={event => field.onChange(+event.target.value)}
                    />
                  </FormControl>
                  <FormDescription>
                    Set the maximum number of requests a single IP can make per
                    minute.
                  </FormDescription>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhook Settings</CardTitle>
            <CardDescription>
              Configure security settings for outgoing webhooks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="isWebhookSigningEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Enable Webhook Signing</FormLabel>
                    <FormDescription>
                      Sign outgoing webhook payloads with a secret key to ensure
                      their authenticity.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save All Settings
          </Button>
        </div>
      </form>
    </Form>
  );
}
