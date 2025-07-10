// src/components/product-form-tabs/circularity-tab.tsx
'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Award, BookCheck, Hash } from 'lucide-react';

import {
  FormControl,
  FormDescription,
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
import type { ProductFormValues } from '@/lib/schemas';

interface CircularityTabProps {
  form: UseFormReturn<ProductFormValues>;
}

export default function CircularityTab({ form }: CircularityTabProps) {
  return (
    <div className="p-6 space-y-6">
      <FormField
        control={form.control}
        name="massBalance.creditsAllocated"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2"><Award />Circularity Credits Allocated</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="e.g., 50"
                {...field}
                onChange={e => field.onChange(e.target.valueAsNumber)}
              />
            </FormControl>
            <FormDescription>
              Number of credits allocated to this product batch from your company's balance.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="massBalance.certificationBody"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2"><BookCheck />Certification Body</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a certification body..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="ISCC PLUS">ISCC PLUS</SelectItem>
                <SelectItem value="REDcert-EU">REDcert-EU</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              The organization that certified the mass balance claim.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="massBalance.certificateNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2"><Hash />Certificate Number</FormLabel>
            <FormControl>
              <Input placeholder="e.g., EU-CERT-2024-12345" {...field} />
            </FormControl>
            <FormDescription>
              The unique identifier for the mass balance certificate.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
