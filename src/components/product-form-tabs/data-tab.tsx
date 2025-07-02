// src/components/product-form-tabs/data-tab.tsx
'use client';

import type {
  UseFormReturn,
  UseFieldArrayReturn,
  FieldArrayWithId,
} from 'react-hook-form';
import { BatteryCharging, Plus, Trash2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { ProductFormValues } from '@/lib/schemas';
import BomAnalysisWidget from '../bom-analysis-widget';

interface DataTabProps {
  form: UseFormReturn<ProductFormValues>;
  materialFields: FieldArrayWithId<ProductFormValues, 'materials', 'id'>[];
  appendMaterial: UseFieldArrayReturn<
    ProductFormValues,
    'materials'
  >['append'];
  removeMaterial: UseFieldArrayReturn<
    ProductFormValues,
    'materials'
  >['remove'];
  certFields: FieldArrayWithId<ProductFormValues, 'certifications', 'id'>[];
  appendCert: UseFieldArrayReturn<
    ProductFormValues,
    'certifications'
  >['append'];
  removeCert: UseFieldArrayReturn<
    ProductFormValues,
    'certifications'
  >['remove'];
}

export default function DataTab({
  form,
  materialFields,
  appendMaterial,
  removeMaterial,
  certFields,
  appendCert,
  removeCert,
}: DataTabProps) {
  const handleApplyBom = (materials: ProductFormValues['materials']) => {
    if (materials) {
      form.setValue('materials', materials, { shouldValidate: true });
    }
  };

  return (
    <div className="p-6">
      <Accordion
        type="multiple"
        defaultValue={['manufacturing', 'materials']}
        className="w-full space-y-4"
      >
        <AccordionItem value="manufacturing" className="border p-4 rounded-lg">
          <AccordionTrigger>
            <h3 className="text-lg font-semibold">Manufacturing</h3>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="manufacturing.facility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facility</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. CleanEnergy Factory"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="manufacturing.country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Germany" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="materials" className="border p-4 rounded-lg">
          <AccordionTrigger>
            <h3 className="text-lg font-semibold">Materials</h3>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-6">
            <BomAnalysisWidget onApply={handleApplyBom} />

            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Or add materials manually.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendMaterial({
                    name: '',
                    percentage: 0,
                    recycledContent: 0,
                    origin: '',
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" /> Add Material
              </Button>
            </div>
            <div className="space-y-4">
              {materialFields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-4 gap-2 items-start border p-4 rounded-md relative"
                >
                  <FormItem className="col-span-4">
                    <FormLabel>Material Name</FormLabel>
                    <FormControl>
                      <Input
                        {...form.register(`materials.${index}.name`)}
                        placeholder="e.g. Recycled Aluminum"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                  <FormItem>
                    <FormLabel>Percentage</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...form.register(`materials.${index}.percentage`, {
                          valueAsNumber: true,
                        })}
                        placeholder="e.g. 60"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                  <FormItem>
                    <FormLabel>Recycled %</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...form.register(
                          `materials.${index}.recycledContent`,
                          {
                            valueAsNumber: true,
                          },
                        )}
                        placeholder="e.g. 100"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                  <FormItem>
                    <FormLabel>Origin</FormLabel>
                    <FormControl>
                      <Input
                        {...form.register(`materials.${index}.origin`)}
                        placeholder="e.g. Germany"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => removeMaterial(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="certifications" className="border p-4 rounded-lg">
          <AccordionTrigger>
            <h3 className="text-lg font-semibold">Certifications</h3>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">
                List relevant product or company certifications.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendCert({ name: '', issuer: '' })}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Certificate
              </Button>
            </div>
            <div className="space-y-4">
              {certFields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-2 gap-2 border p-4 rounded-md relative"
                >
                  <FormItem>
                    <FormLabel>Certificate Name</FormLabel>
                    <FormControl>
                      <Input
                        {...form.register(`certifications.${index}.name`)}
                        placeholder="e.g. EcoCert"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                  <FormItem>
                    <FormLabel>Issuer</FormLabel>
                    <FormControl>
                      <Input
                        {...form.register(`certifications.${index}.issuer`)}
                        placeholder="e.g. EcoCert Group"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => removeCert(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
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
