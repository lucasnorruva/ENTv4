// src/components/company-settings-form.tsx
'use client';

import React, { useTransition, useEffect } from 'react';
import { useForm, useWatch, useFieldArray } from 'react-hook-form';
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
  FormMessage,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

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
      theme: company.settings?.theme ?? {
        light: { primary: '', accent: '' },
        dark: { primary: '', accent: '' },
      },
      customFields: company.settings?.customFields ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'customFields',
  });

  const isBrandingEnabled = useWatch({
    control: form.control,
    name: 'brandingCustomization',
  });

  useEffect(() => {
    form.reset({
      aiEnabled: company.settings?.aiEnabled ?? false,
      apiAccess: company.settings?.apiAccess ?? false,
      brandingCustomization: company.settings?.brandingCustomization ?? false,
      theme: company.settings?.theme ?? {
        light: { primary: '', accent: '' },
        dark: { primary: '', accent: '' },
      },
      customFields: company.settings?.customFields ?? [],
    });
  }, [company, form]);

  const onSubmit = (values: CompanySettingsFormValues) => {
    startSavingTransition(async () => {
      try {
        await saveCompanySettings(company.id, values, adminUser.id);
        toast({
          title: 'Settings Saved',
          description: `Settings for ${company.name} have been updated. Page will reload to apply theme changes.`,
        });
        // A page reload is needed to see theme changes
        setTimeout(() => window.location.reload(), 1500);
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
        </Card>

        {isBrandingEnabled && (
          <Card>
            <CardHeader>
              <CardTitle>Theme Customization</CardTitle>
              <CardDescription>
                Customize the color scheme. Enter HSL values without the `hsl()`
                wrapper (e.g., `231 48% 54%`).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Light Theme</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="theme.light.primary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Color</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 231 48% 54%" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="theme.light.accent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accent Color</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 174 80% 92%" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Dark Theme</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="theme.dark.primary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Color</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 231 48% 65%" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="theme.dark.accent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accent Color</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 174 100% 15%" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Custom Product Fields</CardTitle>
            <CardDescription>
              Define custom data fields that will appear on the product creation
              form for this company.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-col sm:flex-row sm:items-end gap-2 border p-4 rounded-md"
              >
                <FormField
                  control={form.control}
                  name={`customFields.${index}.label`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Field Label</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Internal SKU" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`customFields.${index}.id`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Field ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., internal_sku"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`customFields.${index}.type`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Field Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="boolean">
                            Boolean (Checkbox)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  className="sm:mb-1"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ id: '', label: '', type: 'text' })}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Custom Field
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </div>
      </form>
    </Form>
  );
}