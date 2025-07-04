// src/components/customs-inspection-dialog.tsx
'use client';

import React, { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import {
  customsInspectionFormSchema,
  type CustomsInspectionFormValues,
} from '@/lib/schemas';
import { performCustomsInspection } from '@/lib/actions';
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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface CustomsInspectionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product: Product | null;
  user: User;
  onSave: (updatedProduct: Product) => void;
}

export default function CustomsInspectionDialog({
  isOpen,
  onOpenChange,
  product,
  user,
  onSave,
}: CustomsInspectionDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<CustomsInspectionFormValues>({
    resolver: zodResolver(customsInspectionFormSchema),
    defaultValues: {
      status: 'Cleared',
      authority: '',
      location: '',
      notes: '',
    },
  });

  if (!product) return null;

  const onSubmit = (values: CustomsInspectionFormValues) => {
    startTransition(async () => {
      try {
        const updatedProduct = await performCustomsInspection(
          product.id,
          values,
          user.id,
        );
        toast({
          title: 'Inspection Recorded',
          description: 'The customs event has been added to the passport.',
        });
        onSave(updatedProduct);
        onOpenChange(false);
        form.reset();
      } catch (error: any) {
        toast({
          title: 'Error',
          description:
            error.message || 'Failed to record the inspection.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Record Customs Inspection for {product.productName}
          </DialogTitle>
          <DialogDescription>
            Log a new customs event. This will be added to the product's audit
            trail.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inspection Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
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
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Port of Rotterdam" {...field} />
                  </FormControl>
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
                    <Input placeholder="e.g., Dutch Customs" {...field} />
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
                      placeholder="e.g., Random container check, paperwork verified."
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
                Record Inspection
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
