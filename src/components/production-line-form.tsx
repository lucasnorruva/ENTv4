// src/components/production-line-form.tsx
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveProductionLine } from '@/lib/actions/manufacturing-actions';
import {
  productionLineFormSchema,
  type ProductionLineFormValues,
} from '@/lib/schemas';
import type { ProductionLine, User, Product } from '@/types';

interface ProductionLineFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  line: ProductionLine | null;
  onSave: () => void;
  user: User;
  products: Product[];
}

export default function ProductionLineForm({
  isOpen,
  onOpenChange,
  line,
  onSave,
  user,
  products,
}: ProductionLineFormProps) {
  const [isSaving, startSavingTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<ProductionLineFormValues>({
    resolver: zodResolver(productionLineFormSchema),
    defaultValues: {
      name: '',
      location: '',
      status: 'Idle',
      outputPerHour: 0,
      productId: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (line) {
        form.reset({
          ...line,
          productId: line.productId || '',
        });
      } else {
        form.reset({
          name: '',
          location: '',
          status: 'Idle',
          outputPerHour: 0,
          productId: '',
        });
      }
    }
  }, [line, isOpen, form]);

  const onSubmit = (values: ProductionLineFormValues) => {
    startSavingTransition(async () => {
      try {
        const saved = await saveProductionLine(values, user.id, line?.id);
        toast({
          title: 'Success!',
          description: `Production line "${saved.name}" has been saved.`,
        });
        onSave();
        onOpenChange(false);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to save the production line.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {line ? 'Edit Production Line' : 'Create Production Line'}
          </DialogTitle>
          <DialogDescription>
            {line
              ? 'Update the details for this production line.'
              : 'Fill in the details for a new manufacturing line.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Line Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Assembly Line Alpha" {...field} />
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
                    <Input
                      placeholder="e.g., CleanEnergy Factory, Germany"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Product</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product to manufacture" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {products.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.productName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="outputPerHour"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Output (units/hr)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Idle">Idle</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? 'Saving...' : 'Save Line'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
