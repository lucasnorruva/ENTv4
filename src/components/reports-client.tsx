// src/components/reports-client.tsx
'use client';

import { useState, useTransition, useEffect } from 'react';
import { Calendar as CalendarIcon, Download, Loader2 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { useToast } from '@/hooks/use-toast';
import { exportComplianceReport, exportFullAuditTrail } from '@/lib/actions';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function ReportsClient() {
  const [complianceDate, setComplianceDate] = useState<DateRange | undefined>();
  const [auditDate, setAuditDate] = useState<DateRange | undefined>();

  const [isGenerating, startTransition] = useTransition();
  const [generatingType, setGeneratingType] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const today = new Date();
    setComplianceDate({
      from: subDays(today, 29),
      to: today,
    });
    setAuditDate({
      from: subDays(today, 29),
      to: today,
    });
  }, []);

  const handleDownload = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateReport = (
    reportType: 'compliance' | 'audit',
    dateRange?: DateRange,
  ) => {
    if (!dateRange?.from || !dateRange?.to) {
      toast({
        title: 'Date Range Required',
        description: 'Please select a valid date range to generate a report.',
        variant: 'destructive',
      });
      return;
    }

    setGeneratingType(reportType);
    startTransition(async () => {
      try {
        if (reportType === 'compliance') {
          const content = await exportComplianceReport('csv', { from: dateRange.from!, to: dateRange.to! });
          if(!content) {
            toast({ title: 'No Data Found', description: 'There is no compliance data for the selected period.'});
            setGeneratingType(null);
            return;
          }
          handleDownload(content, `compliance_report_${format(dateRange.from!, 'yyyy-MM-dd')}_to_${format(dateRange.to!, 'yyyy-MM-dd')}.csv`);
        } else if (reportType === 'audit') {
          const content = await exportFullAuditTrail({ from: dateRange.from!, to: dateRange.to! });
           if(!content) {
            toast({ title: 'No Data Found', description: 'There are no audit logs for the selected period.'});
            setGeneratingType(null);
            return;
          }
          handleDownload(content, `audit_trail_${format(dateRange.from!, 'yyyy-MM-dd')}_to_${format(dateRange.to!, 'yyyy-MM-dd')}.csv`);
        }
        toast({ title: 'Report Generated', description: 'Your download will begin shortly.' });
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to generate the report.', variant: 'destructive' });
      } finally {
        setGeneratingType(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Generate and download custom reports for compliance, sustainability,
          and lifecycle analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Compliance Summary</CardTitle>
            <CardDescription>
              A summary of product compliance statuses for a given period.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={'outline'}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !complianceDate && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {complianceDate?.from ? (
                    complianceDate.to ? (
                      <>
                        {format(complianceDate.from, 'LLL dd, y')} -{' '}
                        {format(complianceDate.to, 'LLL dd, y')}
                      </>
                    ) : (
                      format(complianceDate.from, 'LLL dd, y')
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
                  defaultMonth={complianceDate?.from}
                  selected={complianceDate}
                  onSelect={setComplianceDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => handleGenerateReport('compliance', complianceDate)}
              disabled={isGenerating}
            >
              {isGenerating && generatingType === 'compliance' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Generate Report
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Full Audit Trail</CardTitle>
            <CardDescription>
              Export a complete, immutable log of all actions on the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date-audit"
                  variant={'outline'}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !auditDate && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {auditDate?.from ? (
                    auditDate.to ? (
                      <>
                        {format(auditDate.from, 'LLL dd, y')} -{' '}
                        {format(auditDate.to, 'LLL dd, y')}
                      </>
                    ) : (
                      format(auditDate.from, 'LLL dd, y')
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
                  defaultMonth={auditDate?.from}
                  selected={auditDate}
                  onSelect={setAuditDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => handleGenerateReport('audit', auditDate)}
              disabled={isGenerating}
            >
              {isGenerating && generatingType === 'audit' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Generate Report
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
