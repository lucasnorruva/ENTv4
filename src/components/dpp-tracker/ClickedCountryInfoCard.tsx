// src/components/dpp-tracker/ClickedCountryInfoCard.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface CountryProperties {
    ADMIN: string;
    ADM0_A3: string;
}

interface ClickedCountryInfoCardProps {
    countryInfo: CountryProperties;
    onDismiss: () => void;
}

export default function ClickedCountryInfoCard({ countryInfo, onDismiss }: ClickedCountryInfoCardProps) {
    return (
        <Card className="absolute top-24 left-4 z-20 w-full max-w-xs shadow-xl bg-card/95 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-4">
                <CardTitle className="text-md font-semibold">{countryInfo.ADMIN}</CardTitle>
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
                <p className="text-sm text-muted-foreground mt-1">
                    Products in this region: {Math.floor(Math.random() * 20)} (Mock)
                </p>
            </CardContent>
        </Card>
    );
}
