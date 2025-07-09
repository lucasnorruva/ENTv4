// src/components/add-service-record-dialog.tsx
'use client';

import React, { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { addServiceRecord } from '@/lib/actions/product-actions';
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
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  notes: z
    .string()
    .min(10, 'Service notes must be at least 10 characters long.')
    .max(500, 'Service notes must be 500 characters or less.'),
});

interface AddServiceRecordDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product: Product;
  user: User;
  onSave: (updatedProduct: Product) => void;
}

export default function AddServiceRecordDialog({
  isOpen,
  onOpenChange,
  product,
  user,
  onSave,
}: AddServiceRecordDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      try {
        const updatedProduct = await addServiceRecord(
          product.id,
          values.notes,
          user.id,
        );
        toast({
          title: 'Service Record Added',
          description: 'The maintenance log has been updated.',
        });
        onSave(updatedProduct);
        onOpenChange(false);
        form.reset();
      } catch (error: object) {
        toast({
          title: 'Error',
          description:
            error.message || 'Failed to add the service record.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Service Record for {product.productName}</DialogTitle>
          <DialogDescription>
            Log a new repair or maintenance event for this product passport.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Replaced battery, updated firmware..."
                      className="min-h-[120px]"
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
                Add Record
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
