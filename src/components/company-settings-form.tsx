// src/components/company-settings-form.tsx
'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  companySettingsSchema,
  type CompanySettingsFormValues,
} from '@/lib/schemas';
import type { Company, User } from '@/types';
import { saveCompanySettings } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface CompanySettingsFormProps {
  company: Company;
  adminUser: User;
}

export default function CompanySettingsForm({
  company,
  adminUser,
}: CompanySettingsFormProps) {
  const [isSaving, startSavingTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<CompanySettingsFormValues>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      aiEnabled: company.settings?.aiEnabled ?? false,
      apiAccess: company.settings?.apiAccess ?? false,
      brandingCustomization: company.settings?.brandingCustomization ?? false,
    },
  });

  useEffect(() => {
    form.reset({
      aiEnabled: company.settings?.aiEnabled ?? false,
      apiAccess: company.settings?.apiAccess ?? false,
      brandingCustomization: company.settings?.brandingCustomization ?? false,
    });
  }, [company, form]);

  const onSubmit = (values: CompanySettingsFormValues) => {
    startSavingTransition(async () => {
      try {
        await saveCompanySettings(company.id, values, adminUser.id);
        toast({
          title: 'Settings Saved',
          description: `Settings for ${company.name} have been updated.`,
        });
      } catch (error: any) {
        toast({
          title: 'Error Saving Settings',
          description: error.message || 'An unexpected error occurred.',
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
            <CardTitle>Feature Flags</CardTitle>
            <CardDescription>
              Enable or disable specific modules for this company.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="aiEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>AI Features</FormLabel>
                    <FormDescription>
                      Allow users in this company to use AI-powered features
                      like scoring and content generation.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSaving}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="apiAccess"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>API Access</FormLabel>
                    <FormDescription>
                      Allow developers from this company to generate and use API
                      keys.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSaving}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="brandingCustomization"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>UI Branding</FormLabel>
                    <FormDescription>
                      Enable customization of the dashboard theme and logo for
                      this company.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSaving}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
