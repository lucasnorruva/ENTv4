// src/components/data-export-client.tsx
'use client';

import { useState, useTransition } from 'react';
import { Calendar as CalendarIcon, FileDown, HardDriveDownload, Loader2 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { useToast } from '@/hooks/use-toast';
import { exportProducts, exportComplianceReport, exportFullAuditTrail } from '@/lib/actions';
import { cn } from '@/lib/utils';

export default function DataExportClient() {
  const [productFormat, setProductFormat] = useState<'csv' | 'json'>('csv');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
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

  const handleGenerateExport = (exportType: 'Product' | 'Compliance' | 'Audit') => {
    if (!dateRange?.from || !dateRange?.to) {
        toast({ title: "Date Range Required", description: "Please select a valid date range.", variant: "destructive" });
        return;
    }

    setGeneratingType(exportType);
    startTransition(async () => {
      try {
        let fileContent: string = '';
        let mimeType: string = '';
        let fileName: string = '';
        
        switch (exportType) {
          case 'Product':
            toast({
              title: 'Generating Product Report...',
              description: `Your product data is being prepared as a .${productFormat} file.`,
            });
            fileContent = await exportProducts(productFormat, dateRange);
            mimeType = productFormat === 'csv' ? 'text/csv' : 'application/json';
            fileName = `norruva-products-${format(dateRange.from!, 'yyyy-MM-dd')}_to_${format(dateRange.to!, 'yyyy-MM-dd')}.${productFormat}`;
            break;
          case 'Compliance':
            toast({
              title: 'Generating Compliance Report...',
              description: `Your compliance data is being prepared as a .csv file.`,
            });
            fileContent = await exportComplianceReport('csv', dateRange);
            mimeType = 'text/csv';
            fileName = `norruva-compliance-report-${format(dateRange.from!, 'yyyy-MM-dd')}_to_${format(dateRange.to!, 'yyyy-MM-dd')}.csv`;
            break;
          case 'Audit':
             toast({
              title: 'Generating Audit Report...',
              description: `Your full audit trail is being prepared as a .csv file.`,
            });
            fileContent = await exportFullAuditTrail(dateRange);
            mimeType = 'text/csv';
            fileName = `norruva-audit-trail-${format(dateRange.from!, 'yyyy-MM-dd')}_to_${format(dateRange.to!, 'yyyy-MM-dd')}.csv`;
            break;
        }

        if(!fileContent) {
          toast({ title: 'No Data Found', description: 'There is no data for the selected period.'});
          setGeneratingType(null);
          return;
        }
        
        handleDownload(fileContent, fileName, mimeType);
        toast({
          title: 'Report Downloaded!',
          description: 'Your export has been successfully generated.',
        });

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
          sustainability data for a specific period.
        </p>
      </div>

       <Card>
          <CardHeader>
            <CardTitle>Select Date Range</CardTitle>
            <CardDescription>All reports will be generated for the selected date range based on when events occurred or data was last updated.</CardDescription>
          </CardHeader>
          <CardContent>
            <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal md:w-[300px]',
                      !dateRange && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'LLL dd, y')} -{' '}
                          {format(dateRange.to, 'LLL dd, y')}
                        </>
                      ) : (
                        format(dateRange.from, 'LLL dd, y')
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
          </CardContent>
        </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5 text-muted-foreground" />
              Product Data Export
            </CardTitle>
            <CardDescription>
              Export a complete dataset of all products updated in the selected period.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <RadioGroup
              defaultValue="csv"
              className="space-y-2"
              onValueChange={(value) => setProductFormat(value as 'csv' | 'json')}
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
              className="w-full"
              onClick={() => handleGenerateExport('Product')}
              disabled={isGenerating}
            >
              {isGenerating && generatingType === 'Product' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Generate Product Export
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDriveDownload className="h-5 w-5 text-muted-foreground" />
              Compliance Report
            </CardTitle>
            <CardDescription>
              A CSV summary of compliance status for products in the selected period.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
             <p className="text-sm text-muted-foreground">
              This report contains high-level verification and compliance data for auditing purposes.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => handleGenerateExport('Compliance')}
              disabled={isGenerating}
            >
              {isGenerating && generatingType === 'Compliance' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Generate Compliance Export
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDriveDownload className="h-5 w-5 text-muted-foreground" />
              Full Audit Trail
            </CardTitle>
            <CardDescription>
              A complete CSV export of all platform activity in the selected period.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-muted-foreground">
              This report includes all actions taken by all users for security and auditing.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => handleGenerateExport('Audit')}
              disabled={isGenerating}
            >
              {isGenerating && generatingType === 'Audit' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Generate Audit Trail
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
