// src/components/product-import-dialog.tsx
'use client';

import React, { useState, useTransition } from 'react';
import Papa from 'papaparse';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from './ui/badge';
import { bulkProductImportSchema } from '@/lib/schemas';
import type { User } from '@/types';
import { bulkCreateProducts } from '@/lib/actions';
import { Loader2, Upload } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface ProductImportDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: () => void;
  user: User;
}

interface ValidatedRow {
  data: any;
  isValid: boolean;
  errors?: string[];
}

export default function ProductImportDialog({
  isOpen,
  onOpenChange,
  onSave,
  user,
}: ProductImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [validatedData, setValidatedData] = useState<ValidatedRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, startSavingTransition] = useTransition();
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setIsParsing(true);
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: result => {
          const validated = result.data.map(row => {
            const parsed = bulkProductImportSchema.safeParse(row);
            if (parsed.success) {
              return { data: parsed.data, isValid: true };
            } else {
              return {
                data: row,
                isValid: false,
                errors: parsed.error.errors.map(
                  e => `${e.path.join('.')}: ${e.message}`,
                ),
              };
            }
          });
          setValidatedData(validated);
          setIsParsing(false);
        },
        error: () => {
          toast({
            title: 'Parsing Error',
            description: 'Could not parse the CSV file.',
            variant: 'destructive',
          });
          setIsParsing(false);
        },
      });
    }
  };

  const handleImport = () => {
    const productsToImport = validatedData
      .filter(row => row.isValid)
      .map(row => row.data);
    if (productsToImport.length === 0) {
      toast({
        title: 'No valid products',
        description: 'There are no valid products to import.',
        variant: 'destructive',
      });
      return;
    }
    startSavingTransition(async () => {
      try {
        const result = await bulkCreateProducts(productsToImport, user.id);
        toast({
          title: 'Import Successful',
          description: `${result.createdCount} products have been imported and are being processed.`,
        });
        onSave();
        handleClose();
      } catch (error: any) {
        toast({
          title: 'Import Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    });
  };

  const handleClose = () => {
    setFile(null);
    setValidatedData([]);
    onOpenChange(false);
  };

  const validRows = validatedData.filter(row => row.isValid).length;
  const invalidRows = validatedData.length - validRows;

  const getTemplate = () => {
    const headers =
      'productName,productDescription,gtin,category,productImage,manualUrl,materials';
    const example = `"Smart Thermostat","An AI-powered thermostat for your home.","123456789012","Electronics","https://placehold.co/400x400.png","https://example.com/manual.pdf","[{""name"": ""Recycled Plastic"", ""percentage"": 80},{""name"": ""Copper"", ""percentage"": 5}]"`;
    const csvContent = `${headers}\n${example}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'norruva_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Import Products</DialogTitle>
          <DialogDescription>
            Upload a CSV file to create multiple product passports at once.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <Input type="file" accept=".csv" onChange={handleFileChange} />
          <Button variant="outline" size="sm" onClick={getTemplate}>
            Download CSV Template
          </Button>
        </div>

        {isParsing ? (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          validatedData.length > 0 && (
            <>
              <div className="flex gap-4 text-sm">
                <Badge variant="default">{validRows} valid rows</Badge>
                <Badge variant={invalidRows > 0 ? 'destructive' : 'secondary'}>
                  {invalidRows} invalid rows
                </Badge>
              </div>
              <ScrollArea className="flex-1 border rounded-md">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted">
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Errors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validatedData.map((row, index) => (
                      <TableRow
                        key={index}
                        className={!row.isValid ? 'bg-destructive/10' : ''}
                      >
                        <TableCell>
                          <Badge variant={row.isValid ? 'default' : 'destructive'}>
                            {row.isValid ? 'Valid' : 'Invalid'}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.data.productName}</TableCell>
                        <TableCell>{row.data.category}</TableCell>
                        <TableCell className="text-xs text-destructive">
                          {row.errors?.join(', ')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </>
          )
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isSaving || isParsing || validRows === 0}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import {validRows} Products
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
