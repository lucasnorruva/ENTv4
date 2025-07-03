// src/components/onboarding-wizard.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Rocket, PartyPopper } from 'lucide-react';

import {
  onboardingFormSchema,
  type OnboardingFormValues,
} from '@/lib/schemas';
import { completeOnboarding } from '@/lib/actions';
import type { User } from '@/types';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface OnboardingWizardProps {
  user: User;
}

export default function OnboardingWizard({ user }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingFormSchema),
    defaultValues: {
      companyName: `${user.fullName}'s Company`,
      industry: '',
    },
  });

  const onSubmit = (values: OnboardingFormValues) => {
    startTransition(async () => {
      try {
        await completeOnboarding(values, user.id);
        setStep(3); // Move to completion step
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to save your information. Please try again.',
          variant: 'destructive',
        });
      }
    });
  };

  const Step1 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket />
          Let's Get Started
        </CardTitle>
        <CardDescription>
          Just a couple of steps to get your account ready for creating Digital
          Product Passports.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button onClick={() => setStep(2)} className="w-full">
          Continue
        </Button>
      </CardFooter>
    </Card>
  );

  const Step2 = () => (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Tell Us About Your Company</CardTitle>
            <CardDescription>
              This information will be used as the default supplier for your
              product passports.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Company, Inc." {...field} />
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
                    <Input
                      placeholder="e.g., Electronics, Fashion"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Finish Setup
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );

  const Step3 = () => (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto bg-green-100 dark:bg-green-900 p-3 rounded-full w-fit">
          <PartyPopper className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <CardTitle className="mt-4">All Set!</CardTitle>
        <CardDescription>
          Your account is ready. Let's start building a more transparent world,
          one product at a time.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button onClick={() => router.push('/dashboard')} className="w-full">
          Go to Dashboard
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="w-full max-w-md">
      {step === 1 && <Step1 />}
      {step === 2 && <Step2 />}
      {step === 3 && <Step3 />}
    </div>
  );
}
