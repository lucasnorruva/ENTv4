// src/components/company-settings-form.tsx
'use client';

import React, { useTransition, useEffect, useState } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  companySettingsSchema,
  type CompanySettingsFormValues,
} from '@/lib/schemas';
import type { Company, User, CustomFieldDefinition } from '@/types';
import { saveCompanySettings } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

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
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Progress } from './ui/progress';
import { Label } from './ui/label';

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

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    company.settings?.logoUrl || null,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<CompanySettingsFormValues>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      aiEnabled: company.settings?.aiEnabled ?? false,
      apiAccess: company.settings?.apiAccess ?? false,
      brandingCustomization: company.settings?.brandingCustomization ?? false,
      logoUrl: company.settings?.logoUrl ?? '',
      logoFileName: company.settings?.logoFileName ?? '',
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
      logoUrl: company.settings?.logoUrl ?? '',
      logoFileName: company.settings?.logoFileName ?? '',
      theme: company.settings?.theme ?? {
        light: { primary: '', accent: '' },
        dark: { primary: '', accent: '' },
      },
      customFields: company.settings?.customFields ?? [],
    });
    setLogoPreview(company.settings?.logoUrl || null);
  }, [company, form]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = (values: CompanySettingsFormValues) => {
    startSavingTransition(async () => {
      let logoUrl = company.settings?.logoUrl || '';
      let logoFileName = company.settings?.logoFileName || '';

      if (logoFile) {
        setIsUploading(true);
        setUploadProgress(0);
        const storageRef = ref(
          storage,
          `company-logos/${company.id}/${logoFile.name}`,
        );
        const uploadTask = uploadBytesResumable(storageRef, logoFile);

        try {
          logoUrl = await new Promise<string>((resolve, reject) => {
            uploadTask.on(
              'state_changed',
              snapshot =>
                setUploadProgress(
                  (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
                ),
              error => {
                setIsUploading(false);
                reject(error);
              },
              async () => {
                const downloadURL = await getDownloadURL(
                  uploadTask.snapshot.ref,
                );
                setIsUploading(false);
                resolve(downloadURL);
              },
            );
          });
          logoFileName = logoFile.name;
        } catch (error) {
          toast({
            title: 'Logo Upload Failed',
            description: 'Please try again.',
            variant: 'destructive',
          });
          return;
        }
      }

      try {
        const settingsData = { ...values, logoUrl, logoFileName };
        await saveCompanySettings(company.id, settingsData, adminUser.id);
        toast({
          title: 'Settings Saved',
          description: `Settings for ${company.name} have been updated. Page will reload to apply theme changes.`,
        });
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
                Customize the color scheme and upload a logo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Company Logo</Label>
                <div className="flex items-center gap-4 mt-2">
                  <div className="w-24 h-12 flex items-center justify-center bg-muted rounded-md border">
                    {logoPreview ? (
                      <Image
                        src={logoPreview}
                        alt="Logo Preview"
                        width={96}
                        height={48}
                        className="object-contain"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No Logo
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml"
                      onChange={handleLogoChange}
                      disabled={isSaving || isUploading}
                    />
                    {isUploading && (
                      <Progress value={uploadProgress} className="w-full h-1 mt-2" />
                    )}
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Light Theme</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="theme.light.primary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Color (HSL)</FormLabel>
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
                        <FormLabel>Accent Color (HSL)</FormLabel>
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
                        <FormLabel>Primary Color (HSL)</FormLabel>
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
                        <FormLabel>Accent Color (HSL)</FormLabel>
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
            <CardTitle>Custom Data Fields</CardTitle>
            <CardDescription>
              Define custom fields to extend the product passport schema for
              this company.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((item, index) => (
              <div
                key={item.id}
                className="flex items-end gap-2 border p-4 rounded-md"
              >
                <FormField
                  control={form.control}
                  name={`customFields.${index}.id`}
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormLabel>Field ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. internal_sku" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`customFields.${index}.label`}
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormLabel>Field Label</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Internal SKU" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`customFields.${index}.type`}
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormLabel>Field Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="boolean">Boolean (Switch)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ id: '', label: '', type: 'text' })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Custom Field
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
