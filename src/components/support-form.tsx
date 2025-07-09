// src/components/support-form.tsx
'use client';

import { useTransition, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import {
  supportTicketFormSchema,
  type SupportTicketFormValues,
} from '@/lib/schemas';
import { saveSupportTicket } from '@/lib/actions/ticket-actions';
import type { User } from '@/types';

import { Button } from '@/components/ui/button';
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
import { Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface SupportFormProps {
  user?: User;
}

export default function SupportForm({ user }: SupportFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<SupportTicketFormValues>({
    resolver: zodResolver(supportTicketFormSchema),
    defaultValues: {
      name: user?.fullName || '',
      email: user?.email || '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = useCallback(
    (values: SupportTicketFormValues) => {
      startTransition(async () => {
        try {
          await saveSupportTicket(values, user?.id);
          toast({
            title: 'Ticket Submitted',
            description:
              "We've received your request and will get back to you shortly.",
          });
          form.reset({
            name: user?.fullName || '',
            email: user?.email || '',
            subject: '',
            message: '',
          });
        } catch (error) {
          toast({
            title: 'Submission Failed',
            description: 'An error occurred. Please try again.',
            variant: 'destructive',
          });
        }
      });
    },
    [startTransition, toast, user, form],
  );

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Contact Support</CardTitle>
        <CardDescription>
          Fill out the form below and our team will get back to you as soon
          as possible.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Your Email Address"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Issue with product verification"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please describe your issue in detail..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Ticket
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
