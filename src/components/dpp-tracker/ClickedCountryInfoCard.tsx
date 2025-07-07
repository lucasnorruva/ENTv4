// src/components/dpp-tracker/ClickedCountryInfoCard.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Globe } from 'lucide-react';
import Link from 'next/link';

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

export default function ClickedCountryInfoCard({
  countryInfo,
  onDismiss,
  roleSlug,
}: ClickedCountryInfoCardProps) {
  return (
    <Card className="absolute top-24 left-4 z-20 w-full max-w-xs shadow-xl bg-card/95 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-4">
        <CardTitle className="text-md font-semibold">
          {countryInfo.ADMIN}
        </CardTitle>
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
