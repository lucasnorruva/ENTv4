// src/components/service-ticket-form.tsx
'use client';

import React, { useEffect, useTransition, useState } from 'react';
import { useForm } from 'react-hook-form';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveServiceTicket } from '@/lib/actions';
import {
  serviceTicketFormSchema,
  type ServiceTicketFormValues,
} from '@/lib/schemas';
import type { ServiceTicket, User, Product, ProductionLine } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import Image from 'next/image';
import { Progress } from './ui/progress';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

interface ServiceTicketFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  ticket: ServiceTicket | null;
  onSave: (ticket: ServiceTicket) => void;
  user: User;
  products: Product[];
  productionLines: ProductionLine[];
}

type TicketType = 'product' | 'line';

export default function ServiceTicketForm({
  isOpen,
  onOpenChange,
  ticket,
  onSave,
  user,
  products,
  productionLines,
}: ServiceTicketFormProps) {
  const [isSaving, startSavingTransition] = useTransition();
  const [ticketType, setTicketType] = useState<TicketType>('product');
  const { toast } = useToast();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<ServiceTicketFormValues>({
    resolver: zodResolver(serviceTicketFormSchema),
    defaultValues: {
      productId: '',
      productionLineId: '',
      customerName: '',
      issue: '',
      status: 'Open',
      imageUrl: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (ticket) {
        const hasProductId = !!ticket.productId;
        setTicketType(hasProductId ? 'product' : 'line');
        form.reset({
          productId: ticket.productId || '',
          productionLineId: ticket.productionLineId || '',
          customerName: ticket.customerName,
          issue: ticket.issue,
          status: ticket.status,
          imageUrl: ticket.imageUrl || '',
        });
        setImagePreview(ticket.imageUrl || null);
      } else {
        setTicketType('product');
        form.reset({
          productId: '',
          productionLineId: '',
          customerName: '',
          issue: '',
          status: 'Open',
          imageUrl: '',
        });
        setImagePreview(null);
      }
      setImageFile(null);
    }
  }, [ticket, isOpen, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setImageFile(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleTicketTypeChange = (value: TicketType) => {
    setTicketType(value);
    if (value === 'product') {
      form.setValue('productionLineId', '');
    } else {
      form.setValue('productId', '');
    }
  };

  const onSubmit = (values: ServiceTicketFormValues) => {
    startSavingTransition(async () => {
      let imageUrl = ticket?.imageUrl ?? '';

      if (imageFile) {
        setIsUploading(true);
        setUploadProgress(0);
        const storageRef = ref(
          storage,
          `tickets/${user.id}/${Date.now()}-${imageFile.name}`,
        );
        const uploadTask = uploadBytesResumable(storageRef, imageFile);

        try {
          imageUrl = await new Promise<string>((resolve, reject) => {
            uploadTask.on(
              'state_changed',
              snapshot => {
                const progress =
                  (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
              },
              error => {
                setIsUploading(false);
                reject(error);
              },
              async () => {
                const downloadURL = await getDownloadURL(
                  uploadTask.snapshot.ref,
                );
                setIsUploading(false);
                resolve(downloadURL);
              },
            );
          });
        } catch (error) {
          toast({
            title: 'Image Upload Failed',
            description:
              'There was an error uploading your image. Please try again.',
            variant: 'destructive',
          });
          return;
        }
      }

      const payload = {
        ...values,
        imageUrl,
        productId: ticketType === 'product' ? values.productId : undefined,
        productionLineId:
          ticketType === 'line' ? values.productionLineId : undefined,
      };
      try {
        const savedTicket = await saveServiceTicket(payload, user.id, ticket?.id);
        toast({
          title: 'Success!',
          description: `Service ticket ${ticket ? 'updated' : 'created'}.`,
        });
        onSave(savedTicket);
        onOpenChange(false);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to save the service ticket.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {ticket ? 'Edit Service Ticket' : 'Create Service Ticket'}
          </DialogTitle>
          <DialogDescription>
            {ticket
              ? 'Update the details for this service request.'
              : 'Log a new service request for a customer or production line.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormItem>
              <FormLabel>Ticket Type</FormLabel>
              <RadioGroup
                value={ticketType}
                onValueChange={handleTicketTypeChange}
                className="flex gap-4"
              >
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="product" id="r1" />
                  </FormControl>
                  <FormLabel htmlFor="r1">Product</FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="line" id="r2" />
                  </FormControl>
                  <FormLabel htmlFor="r2">Production Line</FormLabel>
                </FormItem>
              </RadioGroup>
            </FormItem>

            {ticketType === 'product' ? (
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.productName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="productionLineId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Production Line</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a production line" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productionLines.map(l => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requester / Customer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="issue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the issue reported by the customer..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={() => (
                <FormItem>
                  <FormLabel>Issue Image (Optional)</FormLabel>
                  {imagePreview && (
                    <div className="mb-2">
                      <Image
                        src={imagePreview}
                        alt="Issue image preview"
                        width={100}
                        height={100}
                        className="rounded-md object-cover"
                        data-ai-hint="issue photo"
                      />
                    </div>
                  )}
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSaving || isUploading}>
                {(isSaving || isUploading) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isUploading
                  ? 'Uploading...'
                  : isSaving
                    ? 'Saving...'
                    : 'Save Ticket'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
