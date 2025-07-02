// src/components/data-export-client.tsx
'use client';

import { useState, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FileDown, HardDriveDownload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportProducts, exportComplianceReport } from '@/lib/actions';

export default function DataExportClient() {
  const [productFormat, setProductFormat] = useState('csv');
  const [isGenerating, startTransition] = useTransition();
  const [generatingType, setGeneratingType] = useState<string | null>(null);

  const { toast } = useToast();

  const handleDownload = (
    content: string,
    fileName: string,
    mimeType: string,
  ) => {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateExport = (exportType: string, format: string) => {
    setGeneratingType(exportType);
    startTransition(async () => {
      try {
        if (exportType === 'Product') {
          toast({
            title: 'Generating Product Report...',
            description: `Your product data is being prepared as a .${format} file.`,
          });
          const fileContent = await exportProducts(format as 'csv' | 'json');
          const mimeType = format === 'csv' ? 'text/csv' : 'application/json';
          const fileName = `norruva-products-${
            new Date().toISOString().split('T')[0]
          }.${format}`;
          handleDownload(fileContent, fileName, mimeType);
          toast({
            title: 'Product Report Downloaded!',
            description: 'Your export has been successfully generated.',
          });
        } else {
          toast({
            title: 'Generating Compliance Report...',
            description: `Your compliance data is being prepared as a .csv file.`,
          });
          const fileContent = await exportComplianceReport('csv');
          const mimeType = 'text/csv';
          const fileName = `norruva-compliance-report-${
            new Date().toISOString().split('T')[0]
          }.csv`;
          handleDownload(fileContent, fileName, mimeType);
          toast({
            title: 'Compliance Report Downloaded!',
            description: 'Your export has been successfully generated.',
          });
        }
      } catch (error) {
        toast({
          title: 'Export Failed',
          description: 'An error occurred while preparing your file.',
          variant: 'destructive',
        });
      } finally {
        setGeneratingType(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Export</h1>
        <p className="text-muted-foreground">
          Generate and download reports for your products, compliance, and
          sustainability data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5 text-muted-foreground" />
              Product Data Export
            </CardTitle>
            <CardDescription>
              Export a complete dataset of all products currently in the
              system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              defaultValue="csv"
              className="space-y-2"
              onValueChange={setProductFormat}
              value={productFormat}
            >
              <Label>File Format</Label>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="product-csv" />
                <Label htmlFor="product-csv">CSV</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="product-json" />
                <Label htmlFor="product-json">JSON</Label>
              </div>
            </RadioGroup>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => handleGenerateExport('Product', productFormat)}
              disabled={isGenerating}
            >
              {isGenerating && generatingType === 'Product' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Generate Product Export
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDriveDownload className="h-5 w-5 text-muted-foreground" />
              Compliance Report Export
            </CardTitle>
            <CardDescription>
              A detailed report of compliance status and identified gaps for
              all products.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-muted-foreground">
              This will generate a CSV file with the compliance status for all
              products.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => handleGenerateExport('Compliance', 'csv')}
              disabled={isGenerating}
            >
              {isGenerating && generatingType === 'Compliance' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Generate Compliance Export (CSV)
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
