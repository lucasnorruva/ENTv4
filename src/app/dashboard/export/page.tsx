// src/app/dashboard/export/page.tsx
'use client';

import { useState } from 'react';
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

export default function DataExportPage() {
  const [productFormat, setProductFormat] = useState('csv');
  const [complianceFormat, setComplianceFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerateExport = (exportType: string) => {
    setIsGenerating(exportType);
    toast({
      title: 'Generating Report...',
      description: `Your ${exportType} export is being prepared and will be available shortly.`,
    });

    // Simulate a delay for report generation
    setTimeout(() => {
      setIsGenerating(null);
      toast({
        title: 'Report Ready!',
        description: `Your ${exportType} export has been generated. (This is a mock action)`,
      });
    }, 2500);
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
              onClick={() => handleGenerateExport('Product')}
              disabled={!!isGenerating}
            >
              {isGenerating === 'Product' && (
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
          <CardContent>
            <RadioGroup
              defaultValue="pdf"
              className="space-y-2"
              onValueChange={setComplianceFormat}
              value={complianceFormat}
            >
              <Label>File Format</Label>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="compliance-pdf" />
                <Label htmlFor="compliance-pdf">PDF</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="xlsx" id="compliance-xlsx" />
                <Label htmlFor="compliance-xlsx">Excel (XLSX)</Label>
              </div>
            </RadioGroup>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => handleGenerateExport('Compliance')}
              disabled={!!isGenerating}
            >
              {isGenerating === 'Compliance' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Generate Compliance Export
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
