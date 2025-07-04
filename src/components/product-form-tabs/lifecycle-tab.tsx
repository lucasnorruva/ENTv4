// src/components/product-form-tabs/lifecycle-tab.tsx
'use client';

import type { UseFormReturn } from 'react-hook-form';
import { BatteryCharging } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import type { ProductFormValues } from '@/lib/schemas';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { Switch } from '../ui/switch';

interface LifecycleTabProps {
  form: UseFormReturn<ProductFormValues>;
}

export default function LifecycleTab({ form }: LifecycleTabProps) {
  return (
    <div className="p-6 space-y-6">
      <FormField
        control={form.control}
        name="lifecycle.energyEfficiencyClass"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Energy Efficiency Class</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(c => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="lifecycle.carbonFootprint"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Carbon Footprint (kg CO2-eq)</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="e.g., 15.5"
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
        name="lifecycle.carbonFootprintMethod"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Footprint Method</FormLabel>
            <FormControl>
              <Input placeholder="e.g., ISO 14067" {...field} />
            </FormControl>
            <FormDescription>
              The methodology used for carbon footprint calculation.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="lifecycle.repairabilityScore"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Repairability Score (1-10)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g., 7"
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
          name="lifecycle.expectedLifespan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expected Lifespan (years)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g., 5"
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
        name="lifecycle.recyclingInstructions"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Recycling Instructions</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Provide end-of-life instructions..."
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="battery" className="border p-4 rounded-lg">
          <AccordionTrigger>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BatteryCharging />
              Battery Details (if applicable)
            </h3>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <FormField
              control={form.control}
              name="battery.type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Battery Type</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Lithium-ion" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="battery.capacityMah"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity (mAh)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 3110"
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
                name="battery.voltage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voltage (V)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 3.83"
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
              name="battery.isRemovable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Is Removable?</FormLabel>
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
