// src/components/product-form-tabs/general-tab.tsx
'use client';

import type { UseFormReturn } from 'react-hook-form';
import Image from 'next/image';
import { Sparkles, Loader2 } from 'lucide-react';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
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
import { Label } from '../ui/label';

interface GeneralTabProps {
  form: UseFormReturn<ProductFormValues>;
  isUploading: boolean;
  isSaving: boolean;
  imagePreview: string | null;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadProgress: number;
  handleGenerateDescription: () => void;
  isGeneratingDescription: boolean;
  isGeneratingImage: boolean;
  handleContextImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleGenerateImage: () => void;
  isAiEnabled: boolean;
}

export default function GeneralTab({
  form,
  isUploading,
  isSaving,
  imagePreview,
  handleImageChange,
  uploadProgress,
  handleGenerateDescription,
  isGeneratingDescription,
  isGeneratingImage,
  handleContextImageChange,
  handleGenerateImage,
  isAiEnabled,
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
            <div className="flex items-center justify-between">
              <FormLabel>Product Description</FormLabel>
              {isAiEnabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateDescription}
                  disabled={isGeneratingDescription || isSaving}
                  className="text-xs"
                >
                  {isGeneratingDescription ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-3 w-3" />
                  )}
                  Generate with AI
                </Button>
              )}
            </div>
            <FormControl>
              <Textarea placeholder="Describe the product..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-4 rounded-lg border p-4">
        <FormLabel>Product Image</FormLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <FormLabel className="text-xs font-normal text-muted-foreground">
              Current Image
            </FormLabel>
            {imagePreview ? (
              <div className="mb-2">
                <Image
                  src={imagePreview}
                  alt="Product image preview"
                  width={150}
                  height={150}
                  className="rounded-md object-cover border"
                  data-ai-hint="product photo"
                />
              </div>
            ) : (
              <div className="h-[150px] w-[150px] bg-muted rounded-md flex items-center justify-center">
                <p className="text-xs text-muted-foreground">No image</p>
              </div>
            )}
            <FormLabel className="text-xs font-normal text-muted-foreground pt-2 block">
              Upload New Image
            </FormLabel>
            <FormControl>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isUploading || isSaving || isGeneratingImage}
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
          </div>
          {isAiEnabled && (
            <div className="space-y-2">
              <FormLabel className="text-xs font-normal text-muted-foreground">
                Generate Image with AI
              </FormLabel>
              <div className="space-y-2">
                <Label
                  htmlFor="context-image"
                  className="text-xs text-muted-foreground"
                >
                  Optional: Provide a reference image (e.g., a sketch)
                </Label>
                <Input
                  id="context-image"
                  type="file"
                  accept="image/*"
                  className="text-xs h-9"
                  onChange={handleContextImageChange}
                  disabled={isGeneratingImage || isSaving}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || isSaving}
              >
                {isGeneratingImage ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {isGeneratingImage ? 'Generating...' : 'Generate New Image'}
              </Button>
            </div>
          )}
        </div>
        <FormMessage />
      </div>

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
                <SelectItem value="Construction">Construction</SelectItem>
                <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
