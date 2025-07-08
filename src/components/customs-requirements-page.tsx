// src/components/customs-requirements-page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Package,
  ArrowUpRight,
  ArrowDownLeft,
  Ship,
  Truck,
  Plane,
  AlertCircle,
  CalendarDays,
  Loader2,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import { MOCK_CUSTOMS_DATA } from '@/lib/customs-data';
import Link from 'next/link';
import { getProducts } from '@/lib/actions';
import type { Product } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format, formatDistanceToNow } from 'date-fns';
import { getStatusBadgeVariant, getStatusBadgeClasses } from '@/lib/dpp-display-utils';

const RiskLevelBadge = ({
  level,
}: {
  level: 'Low' | 'Medium' | 'High';
}) => {
  const Icon = {
    Low: ShieldCheck,
    Medium: ShieldAlert,
    High: ShieldAlert,
  }[level];

  const colorClass = {
    Low: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700',
    Medium:
      'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700',
    High: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700',
  };

  return (
    <Badge variant={'outline'} className={cn('capitalize', colorClass)}>
      <Icon className="mr-1 h-3.5 w-3.5" />
      {level} Risk
    </Badge>
  );
};

const TransportIcon = ({
  transport,
}: {
  transport: Product['transit']['transport'];
}) => {
  const Icon =
    transport === 'Ship' ? Ship : transport === 'Truck' ? Truck : Plane;
  return <Icon className="h-4 w-4" />;
};

export default function CustomsDashboardPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSearchTerm(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      // For this dashboard, we need admin-level access to see all products
      const allProducts = await getProducts('user-admin');
      setProducts(allProducts);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const filteredData = MOCK_CUSTOMS_DATA.filter(item => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    if (!lowerSearchTerm) return true;
    const searchCorpus = [item.region, item.summary, ...item.keyDocs, ...item.relatedRegulations.map(r => r.name), ...(item.notes ? [item.notes] : []), ...item.keywords].join(' ').toLowerCase();
    return searchCorpus.includes(lowerSearchTerm);
  });
  
  const productsInTransit = useMemo(() => products.filter(p => p.transit), [products]);

  const kpis = useMemo(() => {
    const cleared = productsInTransit.filter(p => p.customs?.status === 'Cleared').length;
    const detained = productsInTransit.filter(p => p.customs?.status === 'Detained').length;
    const rejected = productsInTransit.filter(p => p.customs?.status === 'Rejected').length;
    return {
        total: productsInTransit.length,
        cleared,
        detained,
        rejected
    }
  }, [productsInTransit]);


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customs Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor products in transit and look up regional import requirements.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : kpis.total}</div>
            <p className="text-xs text-muted-foreground">Currently in transit</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cleared by Customs</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : kpis.cleared}</div>
            <p className="text-xs text-muted-foreground">Successfully cleared</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipments Detained</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : kpis.detained}</div>
            <p className="text-xs text-muted-foreground">Awaiting inspection or documentation</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipments Rejected</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : kpis.rejected}</div>
            <p className="text-xs text-muted-foreground">Denied entry by customs</p>
            </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Products in Transit</CardTitle>
            <CardDescription>A real-time list of all products currently being shipped across borders.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Transport</TableHead>
                        <TableHead>Origin / Destination</TableHead>
                        <TableHead>ETA</TableHead>
                        <TableHead>Customs Status</TableHead>
                        <TableHead>DPP Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                    ) : productsInTransit.length > 0 ? (
                        productsInTransit.map(p => (
                            <TableRow key={p.id}>
                                <TableCell className="font-medium">{p.productName}</TableCell>
                                <TableCell>{p.transit!.transport && <TransportIcon transport={p.transit!.transport} />}</TableCell>
                                <TableCell>{p.transit!.origin} → {p.transit!.destination}</TableCell>
                                <TableCell suppressHydrationWarning>{format(new Date(p.transit!.eta), "PPP")}</TableCell>
                                <TableCell>
                                    {p.customs?.status ? <Badge variant={getStatusBadgeVariant(p.customs.status)} className={cn('capitalize', getStatusBadgeClasses(p.customs.status))}>{p.customs.status}</Badge> : <Badge variant="outline">En Route</Badge>}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getStatusBadgeVariant(p.verificationStatus)} className={cn('capitalize', getStatusBadgeClasses(p.verificationStatus))}>{p.verificationStatus}</Badge>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow><TableCell colSpan={6} className="h-24 text-center">No products currently in transit.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

      <div className="space-y-4 pt-6">
        <div>
            <h2 className="text-xl font-bold tracking-tight">Customs Requirements Reference</h2>
            <p className="text-muted-foreground">A guide to import requirements for major regions.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by region, regulation, or keyword (e.g., EU, UKCA, CBAM)..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        {filteredData.map(item => (
          <Card key={item.region}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{item.region}</CardTitle>
                <RiskLevelBadge level={item.riskLevel} />
              </div>
              <CardDescription>{item.summary}</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <h4 className="font-semibold text-sm mb-2">Key Documents:</h4>
                <div className="flex flex-wrap gap-2">
                  {item.keyDocs.map(doc => (
                    <Badge key={doc} variant="secondary">
                      {doc}
                    </Badge>
                  ))}
                </div>
              </div>
              <Accordion type="single" collapsible className="w-full mt-4">
                <AccordionItem value="details" className="border-none">
                  <AccordionTrigger className="text-xs p-0 hover:no-underline">
                    Show All Details
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-4">
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Tariff Information</h4>
                      <p className="text-sm text-muted-foreground">{item.tariffs}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Related Regulations</h4>
                      <ul className="space-y-1">
                        {item.relatedRegulations.map(reg => (
                          <li key={reg.name}>
                            <Link href={reg.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                              {reg.name} <ExternalLink className="h-3 w-3" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {item.notes && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Notes</h4>
                        <p className="text-sm text-muted-foreground">{item.notes}</p>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        ))}
        {filteredData.length === 0 && (
          <Card className="text-center py-10">
            <CardContent>
              <p className="text-muted-foreground">
                No regions found for "{searchTerm}".
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
