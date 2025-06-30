// src/components/compliance-path-form.tsx
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveCompliancePath } from '@/lib/actions';
import {
  compliancePathFormSchema,
  type CompliancePathFormValues,
} from '@/lib/schemas';
import type { CompliancePath, User } from '@/types';

interface CompliancePathFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  path: CompliancePath | null;
  onSave: (path: CompliancePath) => void;
  user: User;
}

export default function CompliancePathForm({
  isOpen,
  onOpenChange,
  path,
  onSave,
  user,
}: CompliancePathFormProps) {
  const [isSaving, startSavingTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<CompliancePathFormValues>({
    resolver: zodResolver(compliancePathFormSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      regulations: '',
      minSustainabilityScore: undefined,
      requiredKeywords: '',
      bannedKeywords: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (path) {
        form.reset({
          name: path.name,
          description: path.description,
          category: path.category,
          regulations: path.regulations.join(', '),
          minSustainabilityScore: path.rules.minSustainabilityScore,
          requiredKeywords: path.rules.requiredKeywords?.join(', '),
          bannedKeywords: path.rules.bannedKeywords?.join(', '),
        });
      } else {
        form.reset({
          name: '',
          description: '',
          category: '',
          regulations: '',
          minSustainabilityScore: undefined,
          requiredKeywords: '',
          bannedKeywords: '',
        });
      }
    }
  }, [path, isOpen, form]);

  const onSubmit = (values: CompliancePathFormValues) => {
    startSavingTransition(async () => {
      try {
        const saved = await saveCompliancePath(values, user.id, path?.id);
        toast({
          title: 'Success!',
          description: `Compliance path "${saved.name}" has been saved.`,
        });
        onSave(saved);
        onOpenChange(false);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to save the compliance path.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>
            {path ? 'Edit Compliance Path' : 'Create Compliance Path'}
          </DialogTitle>
          <DialogDescription>
            {path
              ? 'Update the details for this compliance standard.'
              : 'Fill in the details for a new compliance standard.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Path Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., EU Toy Safety Standard" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the path..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Electronics" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="regulations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Regulations (comma-separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., ESPR, RoHS" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <h4 className="text-md font-semibold pt-2 border-t">Rules</h4>
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="minSustainabilityScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min ESG Score</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 60" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="requiredKeywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Required Keywords (comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Organic" {...field} />
                  </FormControl>
                  <FormDescription>
                    Product must contain one of these materials.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bannedKeywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banned Keywords (comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Lead, Cadmium" {...field} />
                  </FormControl>
                  <FormDescription>
                    Product cannot contain any of these materials.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4 border-t">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? 'Saving...' : 'Save Path'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
