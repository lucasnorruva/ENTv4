// src/components/customs-inspection-form.tsx
'use client';

import React, { useTransition, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { performCustomsInspection } from '@/lib/actions/product-actions';
import {
  customsInspectionFormSchema,
  type CustomsInspectionFormValues,
} from '@/lib/schemas';
import type { Product, User } from '@/types';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface CustomsInspectionFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product: Product;
  user: User;
  onSave: (updatedProduct: Product) => void;
}

export default function CustomsInspectionForm({
  isOpen,
  onOpenChange,
  product,
  user,
  onSave,
}: CustomsInspectionFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<CustomsInspectionFormValues>({
    resolver: zodResolver(customsInspectionFormSchema),
    defaultValues: {
      status: 'Detained',
      authority: '',
      location: '',
      notes: '',
    },
  });

  const onSubmit = useCallback((values: CustomsInspectionFormValues) => {
    startTransition(async () => {
      try {
        const updatedProduct = await performCustomsInspection(
          product.id,
          values,
          user.id,
        );
        toast({
          title: 'Customs Event Logged',
          description: `The inspection result for ${product.productName} has been recorded.`,
        });
        onSave(updatedProduct);
        onOpenChange(false);
        form.reset();
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to log the customs event.',
          variant: 'destructive',
        });
      }
    });
  }, [startTransition, product.id, product.productName, user.id, toast, onSave, onOpenChange, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Customs Inspection</DialogTitle>
          <DialogDescription>
            Record the outcome of a customs inspection for{' '}
            <strong>{product.productName}</strong>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select inspection status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Cleared">Cleared</SelectItem>
                      <SelectItem value="Detained">Detained</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="authority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Authority</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., German Customs (Zoll)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Port of Hamburg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Random inspection passed, paperwork requires verification..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log Event
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
