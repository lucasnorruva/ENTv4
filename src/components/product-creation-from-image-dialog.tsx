// src/components/product-creation-from-image-dialog.tsx
'use client';

import React, { useState, useTransition } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { createProductFromImage } from '@/lib/actions/product-actions';
import type { User } from '@/types';
import type { CreateProductFromImageOutput } from '@/types/ai-outputs';
import { Loader2, Sparkles } from 'lucide-react';
import { Label } from './ui/label';

interface ProductCreationFromImageDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAnalysisComplete: (data: CreateProductFromImageOutput) => void;
  user: User;
}

export default function ProductCreationFromImageDialog({
  isOpen,
  onOpenChange,
  onAnalysisComplete,
  user,
}: ProductCreationFromImageDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, startAnalysisTransition] = useTransition();
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleAnalyze = () => {
    if (!file) {
      toast({
        title: 'No Image Selected',
        description: 'Please select an image file to analyze.',
        variant: 'destructive',
      });
      return;
    }

    startAnalysisTransition(async () => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const imageDataUri = reader.result as string;
        try {
          const result = await createProductFromImage(imageDataUri, user.id);
          toast({
            title: 'Analysis Complete',
            description: 'Redirecting to pre-filled product form...',
          });
          onAnalysisComplete(result);
          handleClose();
        } catch (error) {
          console.error(error);
          toast({
            title: 'Analysis Failed',
            description:
              'Could not analyze the image. Please try another one.',
            variant: 'destructive',
          });
        }
      };
      reader.onerror = error => {
        console.error('File reading error:', error);
        toast({
          title: 'File Error',
          description: 'Could not read the selected file.',
          variant: 'destructive',
        });
      };
    });
  };

  const handleClose = () => {
    setFile(null);
    setImagePreview(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Passport from Image</DialogTitle>
          <DialogDescription>
            Upload a product image, and our AI will pre-fill the product form with a generated name, description, and category.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="product-image-upload">Product Image</Label>
            <Input
              id="product-image-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          {imagePreview && (
            <div className="flex justify-center p-4 border rounded-md bg-muted">
              <Image
                src={imagePreview}
                alt="Product preview"
                width={200}
                height={200}
                className="object-contain rounded-md"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !file}
          >
            {isAnalyzing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Analyze Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
