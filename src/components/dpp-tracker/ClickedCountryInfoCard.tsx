// src/components/dpp-tracker/ClickedCountryInfoCard.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Globe, ShieldCheck, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { MOCK_CUSTOMS_DATA } from '@/lib/customs-data';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';


interface CountryProperties {
  ADMIN: string;
  ADM0_A3: string;
  REGION_WB?: string;
}

interface ClickedCountryInfoCardProps {
  countryInfo: CountryProperties;
  onDismiss: () => void;
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
    }[level];
  
    return (
      <Badge variant={'outline'} className={cn('capitalize text-xs', colorClass)}>
        <Icon className="mr-1 h-3.5 w-3.5" />
        {level} Risk
      </Badge>
    );
  };


export default function ClickedCountryInfoCard({
  countryInfo,
  onDismiss,
  roleSlug,
}: ClickedCountryInfoCardProps) {

  const customsData = MOCK_CUSTOMS_DATA.find(d => d.keywords.includes(countryInfo.ADMIN.toLowerCase()));

  return (
    <Card className="absolute top-24 left-4 z-20 w-full max-w-xs shadow-xl bg-card/95 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-start justify-between pb-3 pt-4 px-4">
        <div className='space-y-1'>
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
      <CardContent className="px-4 pb-4 text-xs space-y-2">
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
    </Card>
  );
}
