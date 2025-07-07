// src/components/product-form-tabs/data-tab.tsx
'use client';

import type {
  UseFormReturn,
  UseFieldArrayReturn,
  FieldArrayWithId,
} from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
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
import BomAnalysisWidget from '../bom-analysis-widget';
import type { User } from '@/types';
import { Textarea } from '../ui/textarea';

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
  isAiEnabled: boolean;
  user: User;
}

export default function DataTab({
  form,
  materialFields,
  appendMaterial,
  removeMaterial,
  certFields,
  appendCert,
  removeCert,
  isAiEnabled,
  user,
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
            <FormField
              control={form.control}
              name="manufacturing.manufacturingProcess"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manufacturing Process</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the primary manufacturing process (e.g., Blast Furnace, Injection Molding)..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="materials" className="border p-4 rounded-lg">
          <AccordionTrigger>
            <h3 className="text-lg font-semibold">Materials</h3>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-6">
            {isAiEnabled && <BomAnalysisWidget onApply={handleApplyBom} user={user} />}

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
        <AccordionItem value="packaging" className="border p-4 rounded-lg">
          <AccordionTrigger>
            <h3 className="text-lg font-semibold">Packaging</h3>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
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
                onClick={() =>
                  appendCert({
                    name: '',
                    issuer: '',
                    validUntil: '',
                    documentUrl: '',
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" /> Add Certificate
              </Button>
            </div>
            <div className="space-y-4">
              {certFields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 border p-4 rounded-md relative"
                >
                  <FormField
                    control={form.control}
                    name={`certifications.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Certificate Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. EcoCert" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name={`certifications.${index}.issuer`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issuer</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. EcoCert Group" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`certifications.${index}.validUntil`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valid Until (YYYY-MM-DD)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 2025-12-31" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name={`certifications.${index}.documentUrl`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/cert.pdf" {...field} />
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
                    onClick={() => removeCert(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
