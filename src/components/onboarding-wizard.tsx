// src/components/onboarding-wizard.tsx
'use client';

import React, { useState, useTransition, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';

import type { User } from '@/types';
import { onboardingFormSchema, type OnboardingFormValues } from '@/lib/schemas';
import { completeOnboarding } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

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
import { Rocket, PartyPopper, Loader2 } from 'lucide-react';
import { Progress } from './ui/progress';

export default function OnboardingWizard({ user }: { user: User | null }) {
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingFormSchema),
    defaultValues: {
      companyName: user?.fullName ? `${user.fullName}'s Company` : '',
      industry: '',
    },
  });

  const onSubmit = useCallback(
    async (values: OnboardingFormValues) => {
      if (!user) return;
      startTransition(async () => {
        try {
          await completeOnboarding(values, user.id);
          setStep(2); // Move to the success step
        } catch (error) {
          toast({
            title: 'Onboarding Failed',
            description: 'Could not save your information. Please try again.',
            variant: 'destructive',
          });
        }
      });
    },
    [user, startTransition, toast, setStep],
  );

  const handleFinish = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  if (step === 2) {
    return (
      <div className="flex flex-col items-center text-center">
        <PartyPopper className="h-16 w-16 text-primary mb-4" />
        <h2 className="text-xl font-semibold">You're All Set!</h2>
        <p className="text-muted-foreground mt-2">
          Your company profile has been created. Let's dive into the dashboard.
        </p>
        <Button onClick={handleFinish} className="mt-6 w-full">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Progress value={(step / 2) * 100} className="w-full" />
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full">
          <Rocket className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold">Company Details</h2>
          <p className="text-sm text-muted-foreground">
            Tell us a bit about your company.
          </p>
        </div>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Acme Innovations" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industry (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Electronics, Fashion" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </Button>
        </form>
      </Form>
    </div>
  );
}
