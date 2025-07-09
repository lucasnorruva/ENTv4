// src/components/override-verification-dialog.tsx
'use client';

import React, { useTransition, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { overrideVerification } from '@/lib/actions/product-actions';
import {
  overrideVerificationSchema,
  type OverrideVerificationFormValues,
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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface OverrideVerificationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product: Product;
  user: User;
  onSuccess: (updatedProduct: Product) => void;
}

export default function OverrideVerificationDialog({
  isOpen,
  onOpenChange,
  product,
  user,
  onSuccess,
}: OverrideVerificationDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<OverrideVerificationFormValues>({
    resolver: zodResolver(overrideVerificationSchema),
    defaultValues: {
      reason: '',
    },
  });

  const onSubmit = useCallback((values: OverrideVerificationFormValues) => {
    startTransition(async () => {
      try {
        const updatedProduct = await overrideVerification(
          product.id,
          values.reason,
          user.id,
        );
        toast({
          title: 'Verification Overridden',
          description: 'The product passport has been manually approved.',
        });
        onSuccess(updatedProduct);
        onOpenChange(false);
        form.reset();
      } catch (error: any) {
        toast({
          title: 'Error',
          description:
            error.message || 'Failed to override the verification status.',
          variant: 'destructive',
        });
      }
    });
  }, [startTransition, product.id, user.id, toast, onSuccess, onOpenChange, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Override Verification Failure</DialogTitle>
          <DialogDescription>
            Manually approve this product and set its status to "Verified".
            This action is logged and should only be used in exceptional
            circumstances.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justification</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Exemption documented in attached file ref #123. Issue is non-critical."
                      className="min-h-[100px]"
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
                Confirm Override
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
