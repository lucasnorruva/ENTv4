// src/app/dashboard/reports/page.tsx
'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Download } from 'lucide-react';

export default function ReportsPage() {
  const [date, setDate] = useState<DateRange | undefined>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Generate and download custom reports for compliance, sustainability,
          and lifecycle analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Compliance Summary</CardTitle>
            <CardDescription>
              A summary of product compliance statuses for a given period.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className={cn('grid gap-2')}>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, 'LLL dd, y')} -{' '}
                          {format(date.to, 'LLL dd, y')}
                        </>
                      ) : (
                        format(date.from, 'LLL dd, y')
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
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Recycling Efficiency</CardTitle>
            <CardDescription>
              Analyze the volume and types of materials recycled over time.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-muted-foreground">
              Configure report parameters (e.g., by material, region).
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" disabled>
              Generate Report
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Full Audit Trail</CardTitle>
            <CardDescription>
              Export a complete, immutable log of all actions for a specific product.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-muted-foreground">
              Select a product to export its full history (placeholder).
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" disabled>
              Generate Report
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
