// src/components/product-form-tabs/custom-data-tab.tsx
'use client';

import type { UseFormReturn } from 'react-hook-form';
import type { ProductFormValues } from '@/lib/schemas';
import type { CustomFieldDefinition } from '@/types';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

interface CustomDataTabProps {
  form: UseFormReturn<ProductFormValues>;
  customFields: CustomFieldDefinition[];
}

export default function CustomDataTab({
  form,
  customFields,
}: CustomDataTabProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        {customFields.map(field => (
          <FormField
            key={field.id}
            control={form.control}
            name={`customData.${field.id}`}
            render={({ field: formField }) => {
              if (field.type === 'boolean') {
                return (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>{field.label}</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={!!formField.value}
                        onCheckedChange={formField.onChange}
                      />
                    </FormControl>
                  </FormItem>
                );
              }
              return (
                <FormItem>
                  <FormLabel>{field.label}</FormLabel>
                  <FormControl>
                    <Input
                      type={field.type === 'number' ? 'number' : 'text'}
                      {...formField}
                      onChange={e =>
                        formField.onChange(
                          field.type === 'number'
                            ? e.target.valueAsNumber
                            : e.target.value,
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        ))}
      </div>
    </div>
  );
}
