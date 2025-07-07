// src/components/dashboards/developer-dashboard.tsx
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
  BookOpen,
  CheckCircle,
  ExternalLink,
  KeyRound,
  LayoutGrid,
  Settings,
  Webhook,
  BarChart,
  History,
  Wrench,
  Cog,
  FileCode,
} from 'lucide-react';
import Link from 'next/link';
import type { User } from '@/types';

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

export default function DeveloperDashboard({ user }: { user: User }) {
  const announcements = [
    {
      title: 'New API Version v2 Released',
      date: 'Aug 1, 2024',
      content:
        'Version 2 of the DPP REST API is now live, featuring HATEOAS links and an improved data structure. The v1 API is now deprecated. Check the API Reference for details.',
    },
    {
      title: 'Webhook Signature Verification Now Enabled',
      date: 'Jul 25, 2024',
      content:
        'All outgoing webhooks are now signed with a secret key to ensure authenticity. Please see the documentation for instructions on how to verify signatures.',
    },
  ];

  const serviceStatus = [
    { name: 'GraphQL API', status: 'Operational', icon: Cog },
    { name: 'REST API v2', status: 'Operational', icon: Cog },
    { name: 'REST API v1 (Deprecated)', status: 'Degraded Performance', icon: AlertTriangle },
    { name: 'Webhook Service', status: 'Operational', icon: Webhook },
    { name: 'Developer Portal Site', status: 'Operational', icon: LayoutGrid },
    { name: 'Sandbox Environment API', status: 'Operational', icon: FileCode },
    { name: 'Documentation Site', status: 'Operational', icon: BookOpen },
  ] as const;


  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome to the Developer Portal
        </h1>
      </header>
    
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5" />
                        API Keys & Access
                    </CardTitle>
                    <CardDescription>
                        Manage your API keys to authenticate your requests.
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/dashboard/developer/keys">Manage API Keys</Link>
                    </Button>
                </CardFooter>
             </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Webhook className="h-5 w-5" />
                        Webhooks
                    </CardTitle>
                    <CardDescription>
                        Configure endpoints to receive real-time notifications.
                    </CardDescription>
                </CardHeader>
                 <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/dashboard/developer/webhooks">Manage Webhooks</Link>
                    </Button>
                </CardFooter>
             </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart className="h-5 w-5" />
                        API Analytics
                    </CardTitle>
                    <CardDescription>
                        Monitor your API usage and performance metrics.
                    </CardDescription>
                </CardHeader>
                 <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/dashboard/developer/analytics">View Analytics</Link>
                    </Button>
                </CardFooter>
             </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        API Logs
                    </CardTitle>
                    <CardDescription>
                        View a detailed history of your recent API requests.
                    </CardDescription>
                </CardHeader>
                 <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/dashboard/developer/logs">View Logs</Link>
                    </Button>
                </CardFooter>
             </Card>
          </div>
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
                      <Link href="/docs/api">
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
                <CardTitle>System Status</CardTitle>
              </div>
              <CardDescription>
                Current operational status of Norruva platform components.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
          </Card>
        </div>
      </div>
    </div>
  );
}
