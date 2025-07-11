// src/components/product-form-tabs/digital-link-tab.tsx
'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Rss } from 'lucide-react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { ProductFormValues } from '@/lib/schemas';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface DigitalLinkTabProps {
  form: UseFormReturn<ProductFormValues>;
}

export default function DigitalLinkTab({ form }: DigitalLinkTabProps) {
  return (
    <div className="p-6">
      <Accordion
        type="multiple"
        defaultValue={['nfc']}
        className="w-full space-y-4"
      >
        <AccordionItem value="nfc" className="border p-4 rounded-lg">
          <AccordionTrigger>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Rss />
              NFC Chip Details
            </h3>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <FormField
              control={form.control}
              name="nfc.uid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag UID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 04:8A:7B:8C:9D:01:23" {...field} />
                  </FormControl>
                  <FormDescription>
                    The unique identifier of the NFC tag.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nfc.technology"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Technology</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select NFC technology type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NFC-A (ISO 14443-3A)">
                        NFC-A (ISO 14443-3A)
                      </SelectItem>
                      <SelectItem value="NFC-B (ISO 14443-3B)">
                        NFC-B (ISO 14443-3B)
                      </SelectItem>
                      <SelectItem value="NFC-F (JIS X 6319-4)">
                        NFC-F (JIS X 6319-4)
                      </SelectItem>
                      <SelectItem value="NFC-V (ISO 15693)">
                        NFC-V (ISO 15693)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nfc.writeProtected"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Write Protected</FormLabel>
                    <FormDescription>
                      Is the NFC tag locked from further writes?
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
