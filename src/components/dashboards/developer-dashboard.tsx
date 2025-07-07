// src/components/dashboards/developer-dashboard.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle,
  Code2,
  Cpu,
  Database,
  ExternalLink,
  FileCode,
  KeyRound,
  LayoutGrid,
  LayoutTemplate,
  RefreshCw,
  Search,
  Server,
  Settings,
  ToyBrick,
  Webhook,
  Blocks,
} from 'lucide-react';
import Link from 'next/link';

const StatusBadge = ({
  status,
}: {
  status: 'Operational' | 'Degraded Performance' | 'Under Maintenance';
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
      className={`flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full ${variants[status]}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {status}
    </span>
  );
};

export default function DeveloperDashboard() {
  const navItems = [
    { name: 'Dashboard', icon: LayoutGrid, href: '/dashboard/developer', active: true },
    { name: 'API Keys', icon: KeyRound, href: '/dashboard/developer/keys' },
    { name: 'Webhooks', icon: Webhook, href: '/dashboard/developer/webhooks' },
    { name: 'Playground', icon: ToyBrick, href: '#' },
    { name: 'Docs', icon: BookOpen, href: '/docs', external: true },
    { name: 'Resources', icon: Code2, href: '#' },
    { name: 'Settings', icon: Settings, href: '/dashboard/developer/settings' },
  ];

  const apiMetrics = [
    { label: 'API Calls (Last 24h):', value: '1,234' },
    { label: 'Error Rate (Last 24h):', value: '0.2%' },
    { label: 'Avg. Latency:', value: '120ms' },
    { label: 'API Uptime (Last 7d):', value: '99.95%' },
    { label: 'Peak Requests/Sec:', value: '15' },
  ];

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
    { name: 'DPP Core API', status: 'Operational', icon: Database },
    { name: 'AI Services (Genkit Flows)', status: 'Operational', icon: Cpu },
    { name: 'Data Extraction Service (Mock)', status: 'Degraded Performance', icon: Server },
    { name: 'EBSI Mock Interface', status: 'Operational', icon: Blocks },
    { name: 'Developer Portal Site', status: 'Operational', icon: LayoutTemplate },
    { name: 'Sandbox Environment API', status: 'Under Maintenance', icon: FileCode },
    { name: 'Documentation Site', status: 'Operational', icon: BookOpen },
  ] as const;

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Developer Portal
        </h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Portal (API docs, guides...)"
              className="pl-8 sm:w-[300px]"
            />
          </div>
          <div className="hidden md:flex items-center gap-2 rounded-md border p-2 text-sm">
            <span className="text-muted-foreground">Org:</span>
            <span className="font-semibold">Acme Innovations</span>
          </div>
          <div className="hidden md:flex items-center gap-2 rounded-md border p-2 text-sm">
            <span className="text-muted-foreground">Environment:</span>
            <Select defaultValue="sandbox">
              <SelectTrigger className="h-auto border-none p-0 focus:ring-0">
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <Card>
        <CardContent className="p-2">
          <nav className="flex flex-wrap gap-1">
            {navItems.map(item => (
              <Button
                key={item.name}
                variant={item.active ? 'secondary' : 'ghost'}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              </Button>
            ))}
          </nav>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Key API Metrics & Health (Sandbox)
              </CardTitle>
              <CardDescription>
                Mock conceptual API metrics for the current environment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {apiMetrics.map((metric, i) => (
                  <li
                    key={i}
                    className="flex justify-between items-center text-sm py-2 border-b last:border-0"
                  >
                    <span className="text-muted-foreground">{metric.label}</span>
                    <span className="font-semibold">{metric.value}</span>
                  </li>
                ))}
                <li className="flex justify-between items-center text-sm py-2 text-amber-600 dark:text-amber-400">
                  <span className="font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Overall API Status:
                  </span>
                  <span className="font-semibold">Some Systems Impacted</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="link" asChild className="p-0 h-auto">
                <Link href="/dashboard/developer/analytics">
                  View Full Usage Report <ExternalLink className="ml-1 h-3 w-3" />
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
                    <div className="flex justify-between items-baseline">
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.date}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
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
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Refresh
                </Button>
              </div>
              <CardDescription>
                Current operational status of Norruva platform components.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5" />
                  <p className="font-semibold text-sm">
                    Overall: Some Systems Impacted
                  </p>
                </div>
                <ul className="space-y-3">
                  {serviceStatus.map(service => (
                    <li
                      key={service.name}
                      className="flex justify-between items-center text-sm py-2 border-b last:border-0"
                    >
                      <span className="flex items-center gap-2">
                        <service.icon className="h-4 w-4 text-muted-foreground" />
                        {service.name}
                      </span>
                      <StatusBadge status={service.status} />
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                Last checked: 4:41:42 PM. For detailed incidents, visit
                status.norruva.com (conceptual).
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
