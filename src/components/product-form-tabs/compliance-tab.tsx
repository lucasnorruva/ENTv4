// src/components/product-form-tabs/compliance-tab.tsx
'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Leaf } from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import type { ProductFormValues } from '@/lib/schemas';
import type { CompliancePath } from '@/types';

interface ComplianceTabProps {
  form: UseFormReturn<ProductFormValues>;
  compliancePaths: CompliancePath[];
}

export default function ComplianceTab({
  form,
  compliancePaths,
}: ComplianceTabProps) {
  return (
    <div className="p-6 space-y-6">
      <FormField
        control={form.control}
        name="compliancePathId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Compliance Path</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a compliance standard..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {compliancePaths.map(path => (
                  <SelectItem key={path.id} value={path.id}>
                    {path.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              Select the primary regulatory standard this product must adhere
              to.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <Separator />
      <h3 className="text-lg font-semibold">Declarations</h3>
      <Accordion
        type="multiple"
        defaultValue={['rohs']}
        className="w-full space-y-4"
      >
        <AccordionItem value="rohs" className="border p-4 rounded-lg">
          <AccordionTrigger>RoHS</AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <FormField
              control={form.control}
              name="compliance.rohsCompliant"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>RoHS Compliant</FormLabel>
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
            <FormField
              control={form.control}
              name="compliance.rohsExemption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RoHS Exemption</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 6(c)" {...field} />
                  </FormControl>
                  <FormDescription>
                    If applicable, provide the RoHS exemption details.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="reach" className="border p-4 rounded-lg">
          <AccordionTrigger>REACH / SCIP</AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <FormField
              control={form.control}
              name="compliance.reachSVHC"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>REACH SVHC Declared</FormLabel>
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
            <FormField
              control={form.control}
              name="compliance.scipReference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SCIP Reference</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The reference number from the SCIP database, if applicable.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="weee" className="border p-4 rounded-lg">
          <AccordionTrigger>WEEE</AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <FormField
              control={form.control}
              name="compliance.weeeRegistered"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>WEEE Registered</FormLabel>
                    <FormDescription>
                      Is the product registered with a national WEEE scheme?
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
            <FormField
              control={form.control}
              name="compliance.weeeRegistrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WEEE Registration Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., DE 12345678" {...field} />
                  </FormControl>
                  <FormDescription>
                    The producer registration number for the WEEE scheme.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="eudr" className="border p-4 rounded-lg">
          <AccordionTrigger>
            <h3 className="flex items-center gap-2 font-semibold">
              <Leaf className="h-4 w-4" />
              EUDR
            </h3>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <FormField
              control={form.control}
              name="compliance.eudrCompliant"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>EUDR Compliant</FormLabel>
                    <FormDescription>
                      Product is compliant with EU Deforestation-Free Regulation.
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
            <FormField
              control={form.control}
              name="compliance.eudrDiligenceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>EUDR Due Diligence ID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., DDS-12345-ABC" {...field} />
                  </FormControl>
                  <FormDescription>
                    The reference ID for the due diligence statement.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="additional" className="border p-4 rounded-lg">
          <AccordionTrigger>Additional Declarations</AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <FormField
              control={form.control}
              name="compliance.ceMarked"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>CE Marked</FormLabel>
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
            <FormField
              control={form.control}
              name="compliance.prop65WarningRequired"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Prop 65 Warning Required</FormLabel>
                    <FormDescription>
                      For products sold in California.
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
            <FormField
              control={form.control}
              name="compliance.foodContactSafe"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Food Contact Safe</FormLabel>
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
            <FormField
              control={form.control}
              name="compliance.foodContactComplianceStandard"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Food Contact Standard</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., EU 10/2011" {...field} />
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
