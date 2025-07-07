// src/components/developer-dashboard-client.tsx
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const announcements = [
  {
    title: 'New API Version v1.1 Released',
    date: 'Aug 1, 2024',
    content:
      'Version 1.1 of the DPP API is now live, featuring enhanced query parameters for lifecycle events and new endpoints for supplier data management. Check the API Reference for details.',
  },
  {
    title: 'Webinar: Navigating EU Battery Regulation',
    date: 'Jul 25, 2024',
    content:
      'Join us next week for a deep dive into using the Norruva platform to comply with the new EU Battery Regulation requirements. Registration is open.',
  },
  {
    title: 'Sandbox Environment Maintenance',
    date: 'Jul 15, 2024',
    content:
      'Scheduled maintenance for the Sandbox environment will occur on July 20th, 02:00-04:00 UTC. Production environment will not be affected.',
  },
];

const serviceStatus = [
  { name: 'DPP Core API', status: 'Operational' },
  { name: 'AI Services (Genkit Flows)', status: 'Operational' },
  { name: 'Data Extraction Service (Mock)', status: 'Degraded Performance' },
  { name: 'EBSI Mock Interface', status: 'Operational' },
  { name: 'Developer Portal Site', status: 'Operational' },
  { name: 'Sandbox Environment API', status: 'Under Maintenance' },
  { name: 'Documentation Site', status: 'Operational' },
] as const;

const StatusBadge = ({
  status,
}: {
  status: typeof serviceStatus[number]['status'];
}) => {
  const variants = {
    Operational:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'Degraded Performance':
      'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    'Under Maintenance':
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  };
  const Icon =
    status === 'Operational'
      ? CheckCircle
      : status === 'Degraded Performance'
      ? AlertTriangle
      : Settings;

  return (
    <span
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full',
        variants[status],
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {status}
    </span>
  );
};

const MetricRow = ({
  label,
  value,
  isAlert = false,
}: {
  label: string;
  value: string;
  isAlert?: boolean;
}) => (
  <div className="flex justify-between items-center py-3 border-b last:border-0">
    <span className="text-sm text-muted-foreground">{label}:</span>
    <span
      className={cn(
        'text-sm font-semibold',
        isAlert && 'text-amber-600 dark:text-amber-400 flex items-center gap-2',
      )}
    >
      {isAlert && <AlertTriangle className="h-4 w-4" />}
      {value}
    </span>
  </div>
);

export default function DeveloperDashboardClient() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Key API Metrics & Health (Sandbox)</CardTitle>
            <CardDescription>
              Mock conceptual API metrics for the current environment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MetricRow label="API Calls (Last 24h)" value="1,234" />
            <MetricRow label="Error Rate (Last 24h)" value="0.2%" />
            <MetricRow label="Avg. Latency" value="120ms" />
            <MetricRow label="API Uptime (Last 7d)" value="99.95%" />
            <MetricRow label="Peak Requests/Sec" value="15" />
            <MetricRow
              label="Overall API Status"
              value="Some Systems Impacted"
              isAlert
            />
          </CardContent>
          <CardFooter>
            <Button variant="link" asChild className="p-0 h-auto">
              <Link href="#">
                View Full Usage Report{' '}
                <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform News & Announcements</CardTitle>
            <CardDescription>
              Stay updated with the latest from Norruva.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {announcements.map((item, i) => (
                <div key={i}>
                  <h4 className="font-semibold">{item.title}</h4>
                  <p className="text-xs text-muted-foreground mb-1">
                    {item.date}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.content}
                  </p>
                  <Button
                    variant="link"
                    asChild
                    className="p-0 h-auto text-sm mt-1"
                  >
                    <Link href="#">
                      Learn More <ExternalLink className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>System & Service Status</CardTitle>
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
            <CardDescription>
              Current operational status of Norruva platform components.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 [&>svg]:text-amber-500 mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="font-semibold">
                Overall: Some Systems Impacted
              </AlertTitle>
            </Alert>
            <ul className="space-y-3">
              {serviceStatus.map(service => (
                <li
                  key={service.name}
                  className="flex justify-between items-center text-sm"
                >
                  <span>{service.name}</span>
                  <StatusBadge status={service.status} />
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Last checked: 4:41:42 PM. For detailed incidents, visit{' '}
              <a href="#" className="underline">
                status.norruva.com
              </a>{' '}
              (conceptual).
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
