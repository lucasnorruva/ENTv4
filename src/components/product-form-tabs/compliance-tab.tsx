// src/components/product-form-tabs/compliance-tab.tsx
'use client';

import type { UseFormReturn, UseFieldArrayReturn, FieldArrayWithId } from 'react-hook-form';
import { Leaf, Recycle, Battery, TestTube2, Diamond, Briefcase, Megaphone, Plus, Trash2 } from 'lucide-react';

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
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

interface ComplianceTabProps {
  form: UseFormReturn<ProductFormValues>;
  compliancePaths: CompliancePath[];
  greenClaimFields: FieldArrayWithId<ProductFormValues, 'greenClaims', 'id'>[];
  appendGreenClaim: UseFieldArrayReturn<ProductFormValues, 'greenClaims'>['append'];
  removeGreenClaim: UseFieldArrayReturn<ProductFormValues, 'greenClaims'>['remove'];
}

export default function ComplianceTab({
  form,
  compliancePaths,
  greenClaimFields,
  appendGreenClaim,
  removeGreenClaim,
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
              name="compliance.rohs.compliant"
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
              name="compliance.rohs.exemption"
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
              name="compliance.reach.svhcDeclared"
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
              name="compliance.reach.scipReference"
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
        <AccordionItem value="epr" className="border p-4 rounded-lg">
          <AccordionTrigger>
            <h3 className="flex items-center gap-2 font-semibold">
              <Briefcase className="h-4 w-4" />
              Extended Producer Responsibility (EPR)
            </h3>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <FormField
              control={form.control}
              name="compliance.epr.schemeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>EPR Scheme ID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., DE-12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="compliance.epr.producerRegistrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Producer Registration Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., WEEE-DE-12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="compliance.epr.wasteCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Waste Category</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Small EEE" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="battery" className="border p-4 rounded-lg">
          <AccordionTrigger>
            <h3 className="flex items-center gap-2 font-semibold">
              <Battery className="h-4 w-4" />
              EU Battery Regulation
            </h3>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <FormField
              control={form.control}
              name="compliance.battery.compliant"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Battery Reg. Compliant</FormLabel>
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
              name="compliance.battery.passportId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Battery Passport ID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., urn:uuid:..." {...field} />
                  </FormControl>
                  <FormDescription>
                    The unique identifier for the battery passport, if applicable.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="pfas" className="border p-4 rounded-lg">
          <AccordionTrigger>
            <h3 className="flex items-center gap-2 font-semibold">
              <TestTube2 className="h-4 w-4" />
              PFAS Declaration
            </h3>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <FormField
              control={form.control}
              name="compliance.pfas.declared"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>PFAS Declared</FormLabel>
                    <FormDescription>
                      Confirm if PFAS substances have been declared.
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
        <AccordionItem value="conflictMinerals" className="border p-4 rounded-lg">
          <AccordionTrigger>
            <h3 className="flex items-center gap-2 font-semibold">
              <Diamond className="h-4 w-4" />
              Conflict Minerals (EU)
            </h3>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <FormField
              control={form.control}
              name="compliance.conflictMinerals.compliant"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Conflict Minerals Compliant</FormLabel>
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
              name="compliance.conflictMinerals.reportUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compliance Report URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/cm-report.pdf" {...field} />
                  </FormControl>
                  <FormDescription>
                    Link to the due diligence report (RCOI).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </AccordionContent>
        </AccordionItem>
         <AccordionItem value="espr" className="border p-4 rounded-lg">
          <AccordionTrigger>
            <h3 className="flex items-center gap-2 font-semibold">
              <Leaf className="h-4 w-4" />
              ESPR (Ecodesign)
            </h3>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <FormField
              control={form.control}
              name="compliance.espr.compliant"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>ESPR Compliant</FormLabel>
                    <FormDescription>
                      Product meets Ecodesign for Sustainable Products requirements.
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
              name="compliance.espr.delegatedActUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delegated Act URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://eur-lex.europa.eu/..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Link to the specific product group regulation.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="weee" className="border p-4 rounded-lg">
          <AccordionTrigger>
            <h3 className="flex items-center gap-2 font-semibold">
              <Recycle className="h-4 w-4" />
              WEEE
            </h3>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <FormField
              control={form.control}
              name="compliance.weee.registered"
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
              name="compliance.weee.registrationNumber"
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
        <AccordionItem value="greenClaims" className="border p-4 rounded-lg">
          <AccordionTrigger>
             <h3 className="flex items-center gap-2 font-semibold">
                <Megaphone className="h-4 w-4" />
                Green Claims
            </h3>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
             <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Add marketing claims and provide their substantiation.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendGreenClaim({
                    claim: '',
                    substantiation: '',
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" /> Add Claim
              </Button>
            </div>
            <div className="space-y-4">
                {greenClaimFields.map((field, index) => (
                    <div
                        key={field.id}
                        className="space-y-2 border p-4 rounded-md relative"
                    >
                        <FormField
                        control={form.control}
                        name={`greenClaims.${index}.claim`}
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Claim</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. 100% Recyclable Packaging" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name={`greenClaims.${index}.substantiation`}
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Substantiation</FormLabel>
                            <FormControl>
                                <Textarea placeholder="e.g. Verified by ISO 14021. Certificate #12345." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                         <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => removeGreenClaim(index)}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="additional" className="border p-4 rounded-lg">
          <AccordionTrigger>Additional Declarations</AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <FormField
              control={form.control}
              name="compliance.ce.marked"
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
              name="compliance.prop65.warningRequired"
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
              name="compliance.foodContact.safe"
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
              name="compliance.foodContact.standard"
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
