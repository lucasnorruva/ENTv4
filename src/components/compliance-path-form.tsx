// src/components/compliance-path-form.tsx
'use client';

import React, { useEffect, useTransition } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Bot, Loader2, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveCompliancePath, generateCompliancePathRules } from '@/lib/actions/compliance-actions';
import {
  compliancePathFormSchema,
  type CompliancePathFormValues,
} from '@/lib/schemas';
import type { CompliancePath, User } from '@/types';
import { Separator } from './ui/separator';

interface CompliancePathFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  path: CompliancePath | null;
  onSave: (path: CompliancePath) => void;
  user: User;
}

const FieldArrayInput = ({
  form,
  name,
  label,
  placeholder,
}: {
  form: any;
  name: 'regulations' | 'requiredKeywords' | 'bannedKeywords';
  label: string;
  placeholder: string;
}) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name,
  });

  return (
    <div className="space-y-2">
      <FormLabel>{label}</FormLabel>
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-center gap-2">
          <FormField
            control={form.control}
            name={`${name}.${index}.value`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input placeholder={placeholder} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(index)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ value: '' })}
      >
        <Plus className="mr-2 h-4 w-4" /> Add
      </Button>
    </div>
  );
};

export default function CompliancePathForm({
  isOpen,
  onOpenChange,
  path,
  onSave,
  user,
}: CompliancePathFormProps) {
  const [isSaving, startSavingTransition] = useTransition();
  const [isGenerating, startGenerationTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<CompliancePathFormValues>({
    resolver: zodResolver(compliancePathFormSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      regulations: [{ value: 'ESPR' }],
      minSustainabilityScore: 0,
      requiredKeywords: [],
      bannedKeywords: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (path) {
        form.reset({
          name: path.name,
          description: path.description,
          category: path.category,
          regulations: path.regulations.map(value => ({ value })),
          minSustainabilityScore: path.rules.minSustainabilityScore,
          requiredKeywords:
            path.rules.requiredKeywords?.map(value => ({ value })) || [],
          bannedKeywords:
            path.rules.bannedKeywords?.map(value => ({ value })) || [],
        });
      } else {
        form.reset({
          name: '',
          description: '',
          category: '',
          regulations: [{ value: '' }],
          minSustainabilityScore: 0,
          requiredKeywords: [],
          bannedKeywords: [],
        });
      }
    }
  }, [path, isOpen, form]);

  const onSubmit = (values: CompliancePathFormValues) => {
    startSavingTransition(async () => {
      try {
        const saved = await saveCompliancePath(values, user.id, path?.id);
        toast({
          title: 'Success!',
          description: `Compliance path "${saved.name}" has been saved.`,
        });
        onSave(saved);
        onOpenChange(false);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to save the compliance path.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleGenerateRules = () => {
    const { name, regulations } = form.getValues();
    if (!name || regulations.length === 0 || !regulations[0].value) {
      toast({
        title: 'Input Required',
        description:
          'Please provide a path name and at least one regulation before generating rules.',
        variant: 'destructive',
      });
      return;
    }
    startGenerationTransition(async () => {
      try {
        const result = await generateCompliancePathRules(
          name,
          regulations.map(r => r.value).filter(Boolean),
          user.id,
        );
        if (result.minSustainabilityScore) {
          form.setValue(
            'minSustainabilityScore',
            result.minSustainabilityScore,
          );
        }
        if (result.requiredKeywords) {
          form.setValue(
            'requiredKeywords',
            result.requiredKeywords.map(v => ({ value: v })),
          );
        }
        if (result.bannedKeywords) {
          form.setValue(
            'bannedKeywords',
            result.bannedKeywords.map(v => ({ value: v })),
          );
        }
        toast({
          title: 'Rules Generated',
          description: 'AI-suggested rules have been populated in the form.',
        });
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to generate rules.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>
            {path ? 'Edit Compliance Path' : 'Create Compliance Path'}
          </DialogTitle>
          <DialogDescription>
            {path
              ? 'Update the details for this compliance standard.'
              : 'Fill in the details for a new compliance standard.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Path Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., EU Toy Safety Standard"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the path..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Category</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Electronics" {...field} />
                  </FormControl>
                  <FormDescription>
                    This path will apply to products in this category.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />
            <div className="flex justify-between items-center pt-2">
              <h4 className="text-md font-semibold">Rules</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateRules}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Bot className="mr-2 h-4 w-4" />
                )}
                Generate with AI
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FieldArrayInput
                form={form}
                name="regulations"
                label="Regulations"
                placeholder="e.g. RoHS"
              />
              <FormField
                control={form.control}
                name="minSustainabilityScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum ESG Score</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 60"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FieldArrayInput
                form={form}
                name="requiredKeywords"
                label="Required Keywords"
                placeholder="e.g. Organic"
              />
              <FieldArrayInput
                form={form}
                name="bannedKeywords"
                label="Banned Keywords"
                placeholder="e.g. Lead"
              />
            </div>

            <DialogFooter className="pt-4 border-t">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? 'Saving...' : 'Save Path'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
