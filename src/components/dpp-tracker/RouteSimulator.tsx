'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { mockCountryCoordinates } from '@/lib/country-coordinates';
import { Map, Zap, Loader2 } from 'lucide-react';

interface RouteSimulatorProps {
  onSimulate: (origin: string, destination: string) => void;
  isSimulating: boolean;
}

const countryNames = Object.keys(mockCountryCoordinates).sort();

export default function RouteSimulator({ onSimulate, isSimulating }: RouteSimulatorProps) {
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');

  const handleSimulateClick = () => {
    if (origin && destination && origin !== destination) {
      onSimulate(origin, destination);
    }
  };

  return (
    <div className="bg-background/80 p-2 rounded-lg backdrop-blur-sm flex flex-col sm:flex-row items-center gap-2">
      <Map className="h-4 w-4 text-muted-foreground hidden sm:block" />
      <Select onValueChange={setOrigin} value={origin}>
        <SelectTrigger className="w-full sm:w-[150px] text-xs h-8">
          <SelectValue placeholder="Select Origin" />
        </SelectTrigger>
        <SelectContent>
          {countryNames.map(name => (
            <SelectItem key={name} value={name}>{name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select onValueChange={setDestination} value={destination}>
        <SelectTrigger className="w-full sm:w-[150px] text-xs h-8">
          <SelectValue placeholder="Select Destination" />
        </SelectTrigger>
        <SelectContent>
           {countryNames.map(name => (
            <SelectItem key={name} value={name}>{name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        className="h-8 w-full sm:w-auto"
        onClick={handleSimulateClick}
        disabled={isSimulating || !origin || !destination || origin === destination}
      >
        {isSimulating ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Zap className="mr-2 h-4 w-4" />
        )}
        Analyze Route
      </Button>
    </div>
  );
}
