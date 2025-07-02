// src/components/product-form-tabs/packaging-tab.tsx
'use client';

import type { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { ProductFormValues } from '@/lib/schemas';

interface PackagingTabProps {
  form: UseFormReturn<ProductFormValues>;
}

export default function PackagingTab({ form }: PackagingTabProps) {
  return (
    <div className="p-6 space-y-6">
      <h3 className="text-lg font-semibold">Packaging</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="packaging.type"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Type</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Recycled Cardboard" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="packaging.weight"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Weight (grams)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g., 50"
                  {...field}
                  onChange={e => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="packaging.recycledContent"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Recycled Content (%)</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="e.g. 100"
                {...field}
                onChange={e => field.onChange(e.target.valueAsNumber)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="packaging.recyclable"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <FormLabel>Recyclable</FormLabel>
              <FormDescription>
                Is the packaging material recyclable?
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
