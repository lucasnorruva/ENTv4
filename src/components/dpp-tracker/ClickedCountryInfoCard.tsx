
// src/components/dpp-tracker/ClickedCountryInfoCard.tsx
'use client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  X,
  Globe,
  ShieldCheck,
  ShieldAlert,
  Package,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import Link from 'next/link';
import { MOCK_CUSTOMS_DATA } from '@/lib/customs-data';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';
import { ScrollArea } from '../ui/scroll-area';

interface CountryProperties {
  ADMIN: string;
  ADM0_A3: string;
  REGION_WB?: string;
}

interface ClickedCountryInfoCardProps {
  countryInfo: CountryProperties;
  productsTo: Product[];
  productsFrom: Product[];
  onDismiss: () => void;
  onProductSelect: (productId: string) => void;
  roleSlug: string;
}

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
    <Badge
      variant={'outline'}
      className={cn('capitalize text-xs', colorClass[level])}
    >
      <Icon className="mr-1 h-3.5 w-3.5" />
      {level} Risk
    </Badge>
  );
};

export default function ClickedCountryInfoCard({
  countryInfo,
  productsTo,
  productsFrom,
  onDismiss,
  onProductSelect,
  roleSlug,
}: ClickedCountryInfoCardProps) {
  const customsData = MOCK_CUSTOMS_DATA.find(d =>
    d.keywords.includes(countryInfo.ADMIN.toLowerCase()),
  );

  return (
    <Card className="absolute top-24 left-4 z-20 w-full max-w-sm shadow-xl bg-card/95 backdrop-blur-sm flex flex-col max-h-[calc(100vh-13rem)]">
      <CardHeader className="flex flex-row items-start justify-between pb-3 pt-4 px-4">
        <div className="space-y-1">
          <CardTitle className="text-md font-semibold">
            {countryInfo.ADMIN}
          </CardTitle>
          {customsData && <RiskLevelBadge level={customsData.riskLevel} />}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-2 text-xs space-y-2">
        <p className="text-sm text-muted-foreground">
          ISO Code: {countryInfo.ADM0_A3 || 'N/A'}
        </p>
        {countryInfo.REGION_WB && (
          <p className="text-sm text-muted-foreground">
            Region: {countryInfo.REGION_WB}
          </p>
        )}
        <Button
          variant="link"
          size="sm"
          className="p-0 h-auto text-primary text-xs"
          asChild
        >
          <Link
            href={`/dashboard/${roleSlug}/customs?q=${countryInfo.ADMIN}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Customs Rules <Globe className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardContent>

      {(productsTo.length > 0 || productsFrom.length > 0) && (
        <ScrollArea className="flex-1 px-4 pb-4">
          <div className="space-y-3">
            {productsTo.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-1 flex items-center gap-1">
                  <ArrowDownLeft className="h-3 w-3" /> Inbound Products
                </h4>
                <div className="space-y-1">
                  {productsTo.map(p => (
                    <button
                      key={p.id}
                      onClick={() => onProductSelect(p.id)}
                      className="w-full text-left text-xs p-1 rounded hover:bg-muted transition-colors flex items-center gap-2"
                    >
                      <Package className="h-3 w-3 shrink-0" />
                      <span className="truncate flex-1">{p.productName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {productsFrom.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-1 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" /> Outbound Products
                </h4>
                <div className="space-y-1">
                  {productsFrom.map(p => (
                    <button
                      key={p.id}
                      onClick={() => onProductSelect(p.id)}
                      className="w-full text-left text-xs p-1 rounded hover:bg-muted transition-colors flex items-center gap-2"
                    >
                      <Package className="h-3 w-3 shrink-0" />
                      <span className="truncate flex-1">{p.productName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
}
