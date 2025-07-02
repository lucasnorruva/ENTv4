// src/components/product-form-tabs/general-tab.tsx
'use client';

import type { UseFormReturn } from 'react-hook-form';
import Image from 'next/image';

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
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import type { ProductFormValues } from '@/lib/schemas';

interface GeneralTabProps {
  form: UseFormReturn<ProductFormValues>;
  isUploading: boolean;
  isSaving: boolean;
  imagePreview: string | null;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadProgress: number;
}

export default function GeneralTab({
  form,
  isUploading,
  isSaving,
  imagePreview,
  handleImageChange,
  uploadProgress,
}: GeneralTabProps) {
  return (
    <div className="p-6 space-y-6">
      <FormField
        control={form.control}
        name="productName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Product Name</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. Eco-Friendly Smart Watch"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="gtin"
        render={({ field }) => (
          <FormItem>
            <FormLabel>GTIN (Global Trade Item Number)</FormLabel>
            <FormControl>
              <Input placeholder="e.g. 09501101420014" {...field} />
            </FormControl>
            <FormDescription>
              The unique GS1 barcode number for your product (8, 12, 13, or 14
              digits).
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="productDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Product Description</FormLabel>
            <FormControl>
              <Textarea placeholder="Describe the product..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="productImage"
        render={() => (
          <FormItem>
            <FormLabel>Product Image</FormLabel>
            {imagePreview && (
              <div className="mb-2">
                <Image
                  src={imagePreview}
                  alt="Product image preview"
                  width={100}
                  height={100}
                  className="rounded-md object-cover"
                  data-ai-hint="product photo"
                />
              </div>
            )}
            <FormControl>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isUploading || isSaving}
              />
            </FormControl>
            {isUploading && (
              <div className="flex items-center gap-2 mt-2">
                <Progress value={uploadProgress} className="w-full h-2" />
                <span className="text-xs text-muted-foreground">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="conformityDocUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Declaration of Conformity URL</FormLabel>
            <FormControl>
              <Input placeholder="https://example.com/doc.pdf" {...field} />
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
            <FormLabel>Category</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Fashion">Fashion</SelectItem>
                <SelectItem value="Home Goods">Home Goods</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
