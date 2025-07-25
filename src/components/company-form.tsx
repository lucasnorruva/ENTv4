
// src/components/company-form.tsx
'use client';

import React, { useEffect, useTransition, useCallback } from 'react';
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
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveCompany } from '@/lib/actions/company-actions';
import { companyFormSchema, type CompanyFormValues } from '@/lib/schemas';
import type { Company, User } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Switch } from './ui/switch';

interface CompanyFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  company: Company | null;
  adminUser: User;
  onSave: (company: Company) => void;
}

export default function CompanyForm({
  isOpen,
  onOpenChange,
  company,
  adminUser,
  onSave,
}: CompanyFormProps) {
  const [isSaving, startSavingTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: '',
      ownerId: '',
      industry: '',
      tier: 'free',
      isTrustedIssuer: false,
      revocationListUrl: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (company) {
        form.reset({
          name: company.name,
          ownerId: company.ownerId,
          industry: company.industry || '',
          tier: company.tier || 'free',
          isTrustedIssuer: company.isTrustedIssuer || false,
          revocationListUrl: company.revocationListUrl || '',
        });
      } else {
        form.reset({
          name: '',
          ownerId: '',
          industry: '',
          tier: 'free',
          isTrustedIssuer: false,
          revocationListUrl: '',
        });
      }
    }
  }, [company, isOpen, form]);

  const onSubmit = useCallback(
    (values: CompanyFormValues) => {
      startSavingTransition(async () => {
        try {
          const saved = await saveCompany(values, adminUser.id, company?.id);
          toast({
            title: 'Success!',
            description: `Company "${saved.name}" has been saved.`,
 });
          onSave(saved);
          onOpenChange(false); // Close the dialog on successful save
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to save the company.',
            variant: 'destructive',
          });
        }
      });
    },
    [
      adminUser.id,
      company?.id,
      onSave,
      onOpenChange,
      startSavingTransition,
      toast,
    ],
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {company ? 'Edit Company' : 'Create Company'}
          </DialogTitle>
          <DialogDescription>
            {company
              ? 'Update the details for this company.'
              : 'Fill in the details to create a new company account.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Acme Corporation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="revocationListUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>VC Revocation List URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/status/1.json"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The URL for this company's W3C Status List 2021.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ownerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner User ID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., user-admin" {...field} />
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
                  <FormLabel>Industry</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Electronics" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Tier</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an API tier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Determines the API rate limits for this company.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isTrustedIssuer"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Trusted Issuer (EBSI)</FormLabel>
                    <FormDescription>
                      Mark this company as a verified issuer in the EBSI
                      ecosystem.
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
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? 'Saving...' : 'Save Company'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
